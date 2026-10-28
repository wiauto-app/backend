import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, In, IsNull, MoreThan, Repository } from "typeorm";

import { TemporaryUploadEntity } from "@/src/contexts/shared/file/entities/temporary-upload.entity";
import { ObjectStorageService } from "@/src/contexts/shared/object-storage/object-storage.service";
import { STORAGE_DIRECTORIES } from "@/src/contexts/shared/file/storage-directories";
import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";
import {
  CreateTempUploadHttpDto,
  CreateTempUploadResponseDto,
  ALLOWED_VEHICLE_IMAGE_MIMES,
} from "../api/v1/temp-upload/create-temp-upload.http-dto";
import { ConfirmTempUploadResponseDto } from "../api/v1/temp-upload/confirm-temp-upload.http-dto";

/**
 * Dueño de un upload temporal: perfil autenticado o invitado (cookie `wiauto_guest_id`).
 * Al crear se usa `profileId` si existe; si no, `guestId`.
 */
export interface TempUploadOwner {
  profileId: string | null;
  guestId: string | null;
}

const PENDING_UPLOAD_TTL_MS = 60 * 20 * 1000; // 20 minutos para subir el archivo
const CONFIRMED_UPLOAD_TTL_SEC = 60 * 60 * 24; // 24h para reclamarlo al publicar
const MAX_ACTIVE_GUEST_UPLOADS = 30;

@Injectable()
export class TempUploadService {
  constructor(
    @InjectRepository(TemporaryUploadEntity)
    private readonly tempUploadRepo: Repository<TemporaryUploadEntity>,
    private readonly objectStorageService: ObjectStorageService,
  ) {}

  async createTempUpload(
    owner: TempUploadOwner,
    dto: CreateTempUploadHttpDto,
  ): Promise<CreateTempUploadResponseDto> {
    const profileId = owner.profileId;
    const guestId = profileId ? null : owner.guestId;
    if (!profileId && !guestId) {
      throw new BadRequestException("No se pudo identificar al dueño del upload");
    }

    // Validar MIME
    if (!ALLOWED_VEHICLE_IMAGE_MIMES.includes(dto.mime_type as never)) {
      throw new BadRequestException(
        "Tipo de archivo no permitido. Solo se aceptan JPEG, PNG, WebP y AVIF",
      );
    }

    // Validar tamaño
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (dto.size_bytes > maxSize) {
      throw new BadRequestException(
        `El archivo supera el tamaño máximo de ${maxSize / 1024 / 1024}MB`,
      );
    }

    if (guestId) {
      await this.assertGuestUploadCapacity(guestId);
    }

    // Generar upload_id y storage_path
    const uploadId = uuidv4();
    const ext = this.getExtensionFromMime(dto.mime_type);
    const fileKey = profileId
      ? `temp/${profileId}/${uploadId}${ext}`
      : `temp/guest/${guestId}/${uploadId}${ext}`;
    const storagePath = `${STORAGE_DIRECTORIES.VEHICLES_IMAGES}/${fileKey}`;

    // Generar signed URL con 20 minutos de validez
    const signedUrl = await this.objectStorageService.generateUploadUrl(
      STORAGE_DIRECTORIES.VEHICLES_IMAGES,
      fileKey,
      dto.mime_type,
      60 * 20, // 20 minutos
    );

    // Crear registro en BD
    const expiresAt = new Date(Date.now() + PENDING_UPLOAD_TTL_MS);
    const tempUpload = this.tempUploadRepo.create({
      id: uploadId,
      profile_id: profileId,
      guest_id: guestId,
      storage_path: storagePath,
      mime_type: dto.mime_type,
      size_bytes: dto.size_bytes,
      status: "pending_upload",
      expires_at: expiresAt,
    });

    await this.tempUploadRepo.save(tempUpload);

    return {
      upload_id: uploadId,
      signed_url: signedUrl,
      storage_path: storagePath,
      expires_at: expiresAt.toISOString(),
    };
  }

  async confirmTempUpload(
    uploadId: string,
    owner: TempUploadOwner,
  ): Promise<ConfirmTempUploadResponseDto> {
    // Buscar el temporary upload
    const tempUpload = await this.tempUploadRepo.findOne({
      where: { id: uploadId },
    });

    if (!tempUpload || !this.isOwnedBy(tempUpload, owner)) {
      throw new NotFoundException("Upload temporal no encontrado");
    }

    // Verificar que no haya expirado
    if (tempUpload.expires_at < new Date()) {
      throw new BadRequestException("El upload temporal ha expirado");
    }

    // Verificar que esté en estado pending_upload
    if (tempUpload.status !== "pending_upload") {
      throw new BadRequestException(
        `El upload ya fue procesado con estado: ${tempUpload.status}`,
      );
    }

    // Verificar que el archivo existe en R2
    const exists = await this.checkFileExists(tempUpload.storage_path);
    if (!exists) {
      throw new BadRequestException(
        "El archivo no fue encontrado en el almacenamiento. Asegúrate de completar la subida antes de confirmar",
      );
    }

    // Actualizar estado a uploaded y extender la vida útil a 24h
    // para que el borrador sobreviva a recargas y al login
    const expiresAt = new Date(Date.now() + CONFIRMED_UPLOAD_TTL_SEC * 1000);
    await this.tempUploadRepo.update(uploadId, {
      status: "uploaded",
      expires_at: expiresAt,
    });

    const previewUrl = await this.objectStorageService.generateReadUrl(
      STORAGE_DIRECTORIES.VEHICLES_IMAGES,
      this.toRelativeFileKey(tempUpload.storage_path),
      CONFIRMED_UPLOAD_TTL_SEC,
    );

    return {
      success: true,
      upload_id: uploadId,
      preview_url: previewUrl,
      expires_at: expiresAt.toISOString(),
    };
  }

  /**
   * Obtiene el guest_id común de uploads de invitado referenciados en el anuncio.
   * Sirve cuando el POST /auth/register no trae la cookie wiauto_guest_id.
   */
  async resolveGuestIdFromVehicleImages(
    images: Array<{ upload_id?: string | null }> | undefined,
  ): Promise<string | null> {
    const upload_ids = (images ?? [])
      .map((image) => image.upload_id?.trim())
      .filter((id): id is string => Boolean(id));

    if (upload_ids.length === 0) {
      return null;
    }

    const uploads = await this.tempUploadRepo.find({
      where: { id: In(upload_ids) },
    });

    if (uploads.length !== upload_ids.length) {
      return null;
    }

    const guest_ids = new Set(
      uploads
        .map((upload) => upload.guest_id)
        .filter((id): id is string => Boolean(id)),
    );

    if (guest_ids.size !== 1) {
      return null;
    }

    const [guest_id] = [...guest_ids];
    const all_guest_owned = uploads.every(
      (upload) => upload.profile_id === null && upload.guest_id === guest_id,
    );

    return all_guest_owned ? guest_id : null;
  }

  /**
   * Valida un upload para usarlo en un vehículo. Se acepta si pertenece al perfil
   * o si es de invitado (sin perfil) y su guest_id coincide con la cookie.
   */
  async validateAndGetTempUpload(
    uploadId: string,
    profileId: string,
    guestId: string | null = null,
  ): Promise<TemporaryUploadEntity> {
    const tempUpload = await this.tempUploadRepo.findOne({
      where: { id: uploadId },
    });

    if (!tempUpload || !this.isOwnedBy(tempUpload, { profileId, guestId })) {
      throw new BadRequestException(
        `Upload temporal ${uploadId} no encontrado o no pertenece al usuario`,
      );
    }

    if (tempUpload.expires_at < new Date()) {
      throw new BadRequestException(
        `Upload temporal ${uploadId} ha expirado`,
      );
    }

    if (tempUpload.status === "consumed") {
      throw new BadRequestException(
        `Upload temporal ${uploadId} ya fue consumido`,
      );
    }

    if (tempUpload.status !== "uploaded") {
      throw new BadRequestException(
        `Upload temporal ${uploadId} tiene estado inválido: ${tempUpload.status}. Debe estar en estado "uploaded"`,
      );
    }

    return tempUpload;
  }

  async markAsConsumed(
    uploadIds: string[],
    manager?: EntityManager,
  ): Promise<void> {
    if (uploadIds.length === 0) return;

    const repository = manager
      ? manager.getRepository(TemporaryUploadEntity)
      : this.tempUploadRepo;

    await repository.update(
      { id: In(uploadIds) },
      { status: "consumed" },
    );
  }

  /**
   * Asigna al perfil los uploads de invitado validados. Debe ejecutarse dentro
   * de la transacción de creación del vehículo.
   */
  async claimGuestUploads(
    manager: EntityManager,
    uploadIds: string[],
    profileId: string,
    guestId: string,
  ): Promise<void> {
    if (uploadIds.length === 0) return;

    await manager.update(
      TemporaryUploadEntity,
      { id: In(uploadIds), profile_id: IsNull(), guest_id: guestId },
      { profile_id: profileId },
    );
  }

  private isOwnedBy(
    tempUpload: TemporaryUploadEntity,
    owner: TempUploadOwner,
  ): boolean {
    if (owner.profileId && tempUpload.profile_id === owner.profileId) {
      return true;
    }
    return (
      tempUpload.profile_id === null &&
      owner.guestId !== null &&
      tempUpload.guest_id === owner.guestId
    );
  }

  private async assertGuestUploadCapacity(guestId: string): Promise<void> {
    const activeUploads = await this.tempUploadRepo.count({
      where: {
        guest_id: guestId,
        profile_id: IsNull(),
        status: In(["pending_upload", "uploaded"]),
        expires_at: MoreThan(new Date()),
      },
    });

    if (activeUploads >= MAX_ACTIVE_GUEST_UPLOADS) {
      throw new HttpException(
        `Has alcanzado el máximo de ${MAX_ACTIVE_GUEST_UPLOADS} fotos sin iniciar sesión. Inicia sesión para continuar`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private toRelativeFileKey(storagePath: string): string {
    const prefix = `${STORAGE_DIRECTORIES.VEHICLES_IMAGES}/`;
    return storagePath.startsWith(prefix)
      ? storagePath.slice(prefix.length)
      : storagePath;
  }

  private async checkFileExists(storagePath: string): Promise<boolean> {
    try {
      const buffer = await this.objectStorageService.getObjectBufferByKey(
        storagePath,
      );
      return buffer !== null;
    } catch {
      return false;
    }
  }

  private getExtensionFromMime(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/jpg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
      "image/avif": ".avif",
    };
    return mimeToExt[mimeType] || ".jpg";
  }
}
