import path from "node:path";

import { Logger } from "@nestjs/common";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { mimetype_to_extension } from "@/src/contexts/shared/file/media.constants";
import { STORAGE_DIRECTORIES } from "@/src/contexts/shared/file/storage-directories";
import {
  toFullObjectKey,
  resolveObjectKeyFromStored,
} from "@/src/contexts/shared/file/storage-directories";
import { ObjectStorageService } from "@/src/contexts/shared/object-storage/object-storage.service";
import { TempUploadPreviewService } from "./temp-upload-preview.service";

export interface RelocateVehicleImageSourceInput {
  vehicleId: string;
  imageId: string;
  tempStoragePath: string;
  mimeType: string;
}

export interface RelocateVehicleImageSourceResult {
  /** Path compuesto `vehicles-images/...` persistido en `source_path`. */
  sourcePath: string;
  /** Clave relativa al directorio para el worker (`{vehicleId}/{imageId}.webp`). */
  outputKey: string;
}

@Injectable()
export class RelocateVehicleImageSourceService {
  private readonly logger = new Logger(RelocateVehicleImageSourceService.name);

  constructor(
    private readonly objectStorageService: ObjectStorageService,
    private readonly tempUploadPreviewService: TempUploadPreviewService,
  ) {}

  buildOutputKey(vehicleId: string, imageId: string): string {
    return `${vehicleId}/${imageId}.webp`;
  }

  async execute(
    input: RelocateVehicleImageSourceInput,
  ): Promise<RelocateVehicleImageSourceResult> {
    const extension =
      mimetype_to_extension[input.mimeType.trim().toLowerCase()] ??
      (path.extname(input.tempStoragePath).toLowerCase() || ".jpg");

    const sourceRelativeKey = `${input.vehicleId}/${input.imageId}.source${extension}`;
    const outputKey = this.buildOutputKey(input.vehicleId, input.imageId);

    const tempObjectKey = resolveObjectKeyFromStored(input.tempStoragePath);
    const tempRelativeKey = this.toVehiclesImagesRelativeKey(tempObjectKey);

    await this.objectStorageService.copyObjectInBucket(
      STORAGE_DIRECTORIES.VEHICLES_IMAGES,
      tempRelativeKey,
      sourceRelativeKey,
    );

    try {
      await this.tempUploadPreviewService.deletePreviewSiblingIfExists(
        input.tempStoragePath,
      );
      await this.objectStorageService.deleteObjectByKey(tempObjectKey);
    } catch (deleteError) {
      this.logger.warn(
        `No se pudo borrar el temp ${tempObjectKey} tras relocate: ${
          deleteError instanceof Error ? deleteError.message : "Error desconocido"
        }`,
      );
    }

    const sourcePath = toFullObjectKey(
      STORAGE_DIRECTORIES.VEHICLES_IMAGES,
      sourceRelativeKey,
    );

    return { sourcePath, outputKey };
  }

  private toVehiclesImagesRelativeKey(fullObjectKey: string): string {
    const prefix = `${STORAGE_DIRECTORIES.VEHICLES_IMAGES}/`;
    return fullObjectKey.startsWith(prefix)
      ? fullObjectKey.slice(prefix.length)
      : fullObjectKey;
  }
}
