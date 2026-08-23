import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

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

@Injectable()
export class TempUploadService {
  constructor(
    @InjectRepository(TemporaryUploadEntity)
    private readonly tempUploadRepo: Repository<TemporaryUploadEntity>,
    private readonly objectStorageService: ObjectStorageService,
  ) {}

  async createTempUpload(
    profileId: string,
    dto: CreateTempUploadHttpDto,
  ): Promise<CreateTempUploadResponseDto> {
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

    // Generar upload_id y storage_path
    const uploadId = uuidv4();
    const ext = this.getExtensionFromMime(dto.mime_type);
    const fileKey = `temp/${profileId}/${uploadId}${ext}`;
    const storagePath = `${STORAGE_DIRECTORIES.VEHICLES_IMAGES}/${fileKey}`;

    // Generar signed URL con 20 minutos de validez
    const signedUrl = await this.objectStorageService.generateUploadUrl(
      STORAGE_DIRECTORIES.VEHICLES_IMAGES,
      fileKey,
      dto.mime_type,
      60 * 20, // 20 minutos
    );

    // Crear registro en BD
    const expiresAt = new Date(Date.now() + 60 * 20 * 1000); // 20 minutos
    const tempUpload = this.tempUploadRepo.create({
      id: uploadId,
      profile_id: profileId,
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
    profileId: string,
  ): Promise<ConfirmTempUploadResponseDto> {
    // Buscar el temporary upload
    const tempUpload = await this.tempUploadRepo.findOne({
      where: { id: uploadId, profile_id: profileId },
    });

    if (!tempUpload) {
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

    // Actualizar estado a uploaded
    await this.tempUploadRepo.update(uploadId, {
      status: "uploaded",
    });

    return {
      success: true,
      upload_id: uploadId,
    };
  }

  async validateAndGetTempUpload(
    uploadId: string,
    profileId: string,
  ): Promise<TemporaryUploadEntity> {
    const tempUpload = await this.tempUploadRepo.findOne({
      where: { id: uploadId, profile_id: profileId },
    });

    if (!tempUpload) {
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

  async markAsConsumed(uploadIds: string[]): Promise<void> {
    if (uploadIds.length === 0) return;

    await this.tempUploadRepo.update(
      { id: In(uploadIds) },
      { status: "consumed" },
    );
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
