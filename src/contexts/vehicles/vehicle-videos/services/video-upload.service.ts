import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, In, MoreThan, Repository } from "typeorm";

import { EntitlementsService } from "@/src/contexts/billing/services/entitlements.service";
import {
  VEHICLE_VIDEO_DURATION_TOLERANCE_S,
  VEHICLE_VIDEO_MAX_DURATION_S,
  VEHICLE_VIDEO_MAX_SIZE_BYTES,
  VEHICLE_VIDEO_MIME_ALIASES,
  VEHICLE_VIDEO_MIME_TO_EXTENSION,
  VEHICLE_VIDEO_PART_SIZE,
} from "@/src/contexts/shared/file/media.constants";
import { STORAGE_DIRECTORIES } from "@/src/contexts/shared/file/storage-directories";
import {
  probeVideo,
  type VideoProbeResult,
} from "@/src/contexts/shared/file/video/ffprobe";
import { MultipartObjectStorageService } from "@/src/contexts/shared/object-storage/multipart-object-storage.service";
import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";

import {
  VIDEO_UPLOAD_SESSION_STATUS,
  VideoUploadSessionEntity,
} from "../entities/video-upload-session.entity";
import type {
  CompleteVideoUploadHttpDto,
  CompleteVideoUploadResponseDto,
  InitVideoUploadHttpDto,
  InitVideoUploadResponseDto,
  VideoPartUrlsResponseDto,
  VideoUploadedPartsResponseDto,
} from "../api/v1/video-upload/video-upload.http-dto";

export interface VideoUploadActor {
  profile_id: string;
  is_admin: boolean;
}

/** Tiempo para subir todas las partes (multipart abierto). */
const INITIATED_TTL_MS = 6 * 60 * 60 * 1000;
/** Tiempo para usar el vídeo subido en un anuncio. */
const UPLOADED_TTL_MS = 24 * 60 * 60 * 1000;
const PART_URL_EXPIRES_S = 60 * 60;
const PROBE_URL_EXPIRES_S = 5 * 60;
const MAX_ACTIVE_SESSIONS_PER_PROFILE = 10;
const MAX_PARTS = 10_000;

/** Exportado para tests. */
export const normalizeVideoMime = (mime: string): string => {
  const base = mime.trim().toLowerCase().split(";")[0];
  // El Content-Type del original se sirve tal cual al navegador: debe ser estándar
  return VEHICLE_VIDEO_MIME_ALIASES[base] ?? base;
};

/**
 * `true` si ffprobe se ejecutó y el archivo no es un vídeo legible.
 * `false` si el fallo es de infraestructura (binario ausente, timeout, red):
 * en ese caso no se culpa al archivo ni se borra.
 */
export const isInvalidMediaProbeError = (error: unknown): boolean => {
  if ((error as NodeJS.ErrnoException | null)?.code === "ENOENT") {
    return false;
  }
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("terminó con código") ||
    message.includes("salida no válida")
  );
};

/** Valida el resultado de ffprobe contra las reglas de vídeos de vehículos. */
export const assertProbeIsAcceptable = (probe: VideoProbeResult): void => {
  if (!probe.has_video) {
    throw new UnprocessableEntityException(
      "El archivo no contiene una pista de vídeo válida.",
    );
  }
  if (
    probe.duration_s !== null &&
    probe.duration_s >
      VEHICLE_VIDEO_MAX_DURATION_S + VEHICLE_VIDEO_DURATION_TOLERANCE_S
  ) {
    throw new UnprocessableEntityException(
      `El vídeo dura más de ${VEHICLE_VIDEO_MAX_DURATION_S} segundos.`,
    );
  }
};

/**
 * Sesiones de subida multipart directa a R2. El cliente solo conoce el `id`
 * de la sesión: la key, el UploadId de S3 y la propiedad viven en BD.
 */
@Injectable()
export class VideoUploadService {
  private readonly logger = new Logger(VideoUploadService.name);

  constructor(
    @InjectRepository(VideoUploadSessionEntity)
    private readonly sessions_repository: Repository<VideoUploadSessionEntity>,
    private readonly storage: MultipartObjectStorageService,
    private readonly entitlements_service: EntitlementsService,
  ) {}

  async initUpload(
    actor: VideoUploadActor,
    dto: InitVideoUploadHttpDto,
  ): Promise<InitVideoUploadResponseDto> {
    if (!actor.is_admin) {
      await this.entitlements_service.assertCanUploadVideos(actor.profile_id);
    }

    const mime_type = normalizeVideoMime(dto.mime_type);
    const extension = VEHICLE_VIDEO_MIME_TO_EXTENSION[mime_type];
    if (!extension) {
      throw new BadRequestException(
        "Formato de vídeo no admitido. Usa MP4, MOV, WebM, MKV, AVI o 3GP.",
      );
    }

    if (dto.size_bytes > VEHICLE_VIDEO_MAX_SIZE_BYTES) {
      throw new BadRequestException(
        `El vídeo supera el tamaño máximo de ${VEHICLE_VIDEO_MAX_SIZE_BYTES / 1024 / 1024} MB.`,
      );
    }

    const part_size = VEHICLE_VIDEO_PART_SIZE;
    const part_count = Math.max(1, Math.ceil(dto.size_bytes / part_size));
    if (part_count > MAX_PARTS) {
      throw new BadRequestException("El vídeo es demasiado grande.");
    }

    await this.assertSessionCapacity(actor.profile_id);

    const id = uuidv4();
    const storage_key = `${STORAGE_DIRECTORIES.VEHICLES_VIDEOS}/temp/${actor.profile_id}/${id}/original${extension}`;
    const multipart_upload_id = await this.storage.createMultipartUpload(
      storage_key,
      mime_type,
    );

    const expires_at = new Date(Date.now() + INITIATED_TTL_MS);
    await this.sessions_repository.save(
      this.sessions_repository.create({
        id,
        profile_id: actor.profile_id,
        storage_key,
        multipart_upload_id,
        mime_type,
        original_filename: dto.original_filename?.trim() ? dto.original_filename.trim() : null,
        size_bytes: dto.size_bytes,
        part_size,
        part_count,
        status: VIDEO_UPLOAD_SESSION_STATUS.INITIATED,
        expires_at,
      }),
    );

    return {
      upload_id: id,
      part_size,
      part_count,
      expires_at: expires_at.toISOString(),
    };
  }

  async getPartUrls(
    upload_id: string,
    profile_id: string,
    part_numbers: number[],
  ): Promise<VideoPartUrlsResponseDto> {
    const session = await this.getOpenSession(upload_id, profile_id);

    const unique = [...new Set(part_numbers)].sort((a, b) => a - b);
    const invalid = unique.find((part) => part < 1 || part > session.part_count);
    if (invalid !== undefined) {
      throw new BadRequestException(
        `La parte ${invalid} no existe en esta subida (1-${session.part_count}).`,
      );
    }

    const urls = await Promise.all(
      unique.map(async (part_number) => ({
        part_number,
        url: await this.storage.signUploadPart(
          session.storage_key,
          session.multipart_upload_id,
          part_number,
          PART_URL_EXPIRES_S,
        ),
      })),
    );

    return { urls };
  }

  async listUploadedParts(
    upload_id: string,
    profile_id: string,
  ): Promise<VideoUploadedPartsResponseDto> {
    const session = await this.getOpenSession(upload_id, profile_id);
    const parts = await this.storage.listParts(
      session.storage_key,
      session.multipart_upload_id,
    );
    if (parts === null) {
      await this.markExpired(session);
      throw new ConflictException(
        "La subida ya no está disponible. Vuelve a añadir el vídeo.",
      );
    }
    return { parts };
  }

  async completeUpload(
    upload_id: string,
    profile_id: string,
    dto: CompleteVideoUploadHttpDto,
  ): Promise<CompleteVideoUploadResponseDto> {
    const session = await this.getOwnedSession(upload_id, profile_id);

    // Reintento del cliente tras un timeout: la sesión ya está completa
    if (session.status === VIDEO_UPLOAD_SESSION_STATUS.UPLOADED) {
      return this.toCompleteResponse(session);
    }
    this.assertOpen(session);

    const parts = [...dto.parts].sort((a, b) => a.part_number - b.part_number);
    const numbers_match =
      parts.length === session.part_count &&
      parts.every((part, index) => part.part_number === index + 1);
    if (!numbers_match) {
      throw new BadRequestException(
        `Faltan partes del vídeo: se esperaban ${session.part_count}.`,
      );
    }

    try {
      await this.storage.completeMultipartUpload(
        session.storage_key,
        session.multipart_upload_id,
        parts,
      );
    } catch (error) {
      // Reintento tras un fallo posterior (p. ej. ffprobe): el multipart ya
      // se completó en R2 y el objeto existe con el tamaño esperado.
      const existing_size = await this.storage.headObjectSize(
        session.storage_key,
      );
      if (existing_size !== session.size_bytes) {
        this.logger.warn(
          `No se pudo completar el multipart ${session.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
        throw new BadRequestException(
          "No se pudo completar la subida del vídeo. Reintenta.",
        );
      }
    }

    const size = await this.storage.headObjectSize(session.storage_key);
    if (size === null || size !== session.size_bytes) {
      await this.rejectUploadedObject(session);
      throw new UnprocessableEntityException(
        "El vídeo subido no coincide con el archivo seleccionado.",
      );
    }

    let probe: VideoProbeResult;
    try {
      const url = await this.storage.signGetObject(
        session.storage_key,
        PROBE_URL_EXPIRES_S,
      );
      probe = await probeVideo(url);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      if (!isInvalidMediaProbeError(error)) {
        // Fallo del servidor (ffprobe no instalado, timeout): el vídeo se
        // conserva y el cliente puede reintentar `complete`.
        this.logger.error(
          `ffprobe no disponible para la subida ${session.id}: ${reason}`,
        );
        throw new ServiceUnavailableException(
          "No se pudo verificar el vídeo ahora mismo. Reintenta en unos minutos.",
        );
      }
      this.logger.warn(`ffprobe rechazó la subida ${session.id}: ${reason}`);
      await this.rejectUploadedObject(session);
      throw new UnprocessableEntityException(
        "No se pudo leer el vídeo. Prueba con otro archivo.",
      );
    }

    try {
      assertProbeIsAcceptable(probe);
    } catch (error) {
      await this.rejectUploadedObject(session);
      throw error;
    }

    session.status = VIDEO_UPLOAD_SESSION_STATUS.UPLOADED;
    session.duration_s = probe.duration_s;
    session.width = probe.width;
    session.height = probe.height;
    session.expires_at = new Date(Date.now() + UPLOADED_TTL_MS);
    await this.sessions_repository.save(session);

    return this.toCompleteResponse(session);
  }

  async abortUpload(upload_id: string, profile_id: string): Promise<void> {
    const session = await this.getOwnedSession(upload_id, profile_id);

    if (session.status === VIDEO_UPLOAD_SESSION_STATUS.INITIATED) {
      await this.storage.abortMultipartUpload(
        session.storage_key,
        session.multipart_upload_id,
      );
    } else if (session.status === VIDEO_UPLOAD_SESSION_STATUS.UPLOADED) {
      await this.storage.deleteObject(session.storage_key);
    } else {
      // consumed (ya es de un anuncio), aborted o expired: nada que hacer
      return;
    }

    await this.sessions_repository.update(session.id, {
      status: VIDEO_UPLOAD_SESSION_STATUS.ABORTED,
    });
  }

  /**
   * Sesiones listas para asociarse a un vehículo (`uploaded`, del perfil,
   * sin caducar). Mantiene el orden de `upload_ids`.
   */
  async validateForVehicle(
    upload_ids: string[],
    profile_id: string,
  ): Promise<VideoUploadSessionEntity[]> {
    if (upload_ids.length === 0) {
      return [];
    }
    if (new Set(upload_ids).size !== upload_ids.length) {
      throw new BadRequestException("Hay vídeos repetidos en el anuncio.");
    }

    const sessions = await this.sessions_repository.find({
      where: { id: In(upload_ids) },
    });
    const by_id = new Map(sessions.map((session) => [session.id, session]));
    const now = new Date();

    return upload_ids.map((id) => {
      const session = by_id.get(id);
      if (!session || session.profile_id !== profile_id) {
        throw new BadRequestException(
          "Algún vídeo no se ha subido correctamente. Vuelve a añadirlo.",
        );
      }
      if (session.status === VIDEO_UPLOAD_SESSION_STATUS.CONSUMED) {
        throw new BadRequestException(
          "Algún vídeo ya está en otro anuncio. Vuelve a añadirlo.",
        );
      }
      if (
        session.status !== VIDEO_UPLOAD_SESSION_STATUS.UPLOADED ||
        session.expires_at < now
      ) {
        throw new BadRequestException(
          "Algún vídeo no terminó de subirse o ha caducado. Vuelve a añadirlo.",
        );
      }
      return session;
    });
  }

  async markConsumed(
    upload_ids: string[],
    manager: EntityManager,
  ): Promise<void> {
    if (upload_ids.length === 0) {
      return;
    }
    await manager.update(
      VideoUploadSessionEntity,
      { id: In(upload_ids), status: VIDEO_UPLOAD_SESSION_STATUS.UPLOADED },
      { status: VIDEO_UPLOAD_SESSION_STATUS.CONSUMED },
    );
  }

  private async assertSessionCapacity(profile_id: string): Promise<void> {
    const active = await this.sessions_repository.count({
      where: {
        profile_id,
        status: In([
          VIDEO_UPLOAD_SESSION_STATUS.INITIATED,
          VIDEO_UPLOAD_SESSION_STATUS.UPLOADED,
        ]),
        expires_at: MoreThan(new Date()),
      },
    });
    if (active >= MAX_ACTIVE_SESSIONS_PER_PROFILE) {
      throw new HttpException(
        `Tienes demasiados vídeos pendientes (máximo ${MAX_ACTIVE_SESSIONS_PER_PROFILE}). Publica o elimina alguno.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async getOwnedSession(
    upload_id: string,
    profile_id: string,
  ): Promise<VideoUploadSessionEntity> {
    const session = await this.sessions_repository.findOne({
      where: { id: upload_id },
    });
    // 404 también si es de otro perfil: no revela que existe
    if (!session || session.profile_id !== profile_id) {
      throw new NotFoundException("Subida de vídeo no encontrada.");
    }
    return session;
  }

  private async getOpenSession(
    upload_id: string,
    profile_id: string,
  ): Promise<VideoUploadSessionEntity> {
    const session = await this.getOwnedSession(upload_id, profile_id);
    this.assertOpen(session);
    return session;
  }

  private assertOpen(session: VideoUploadSessionEntity): void {
    if (session.status !== VIDEO_UPLOAD_SESSION_STATUS.INITIATED) {
      throw new ConflictException(
        "Esta subida ya no admite partes. Vuelve a añadir el vídeo.",
      );
    }
    if (session.expires_at < new Date()) {
      throw new ConflictException(
        "La subida ha caducado. Vuelve a añadir el vídeo.",
      );
    }
  }

  private async markExpired(session: VideoUploadSessionEntity): Promise<void> {
    await this.sessions_repository.update(session.id, {
      status: VIDEO_UPLOAD_SESSION_STATUS.EXPIRED,
    });
  }

  private async rejectUploadedObject(
    session: VideoUploadSessionEntity,
  ): Promise<void> {
    try {
      await this.storage.deleteObject(session.storage_key);
    } catch (error) {
      this.logger.warn(
        `No se pudo borrar el vídeo rechazado ${session.storage_key}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    await this.sessions_repository.update(session.id, {
      status: VIDEO_UPLOAD_SESSION_STATUS.ABORTED,
    });
  }

  private toCompleteResponse(
    session: VideoUploadSessionEntity,
  ): CompleteVideoUploadResponseDto {
    return {
      upload_id: session.id,
      status: "uploaded",
      duration_s: session.duration_s,
      width: session.width,
      height: session.height,
      expires_at: session.expires_at.toISOString(),
    };
  }
}
