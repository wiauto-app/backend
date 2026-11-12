import path from "node:path";

import { Injectable, Logger } from "@nestjs/common";

import { ImageOptimizationPipeline } from "@/src/contexts/shared/file/image-formats/image-optimization-pipeline.service";
import { STORAGE_DIRECTORIES } from "@/src/contexts/shared/file/storage-directories";
import { ObjectStorageService } from "@/src/contexts/shared/object-storage/object-storage.service";

const TEMP_UPLOAD_PREVIEW_MAX_WIDTH = 1200;
const TEMP_UPLOAD_PREVIEW_WEBP_QUALITY = 72;

const MIME_NEEDS_WEB_PREVIEW = new Set([
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
  "image/avif",
  "image/tiff",
  "image/tif",
  "image/bmp",
]);

@Injectable()
export class TempUploadPreviewService {
  private readonly logger = new Logger(TempUploadPreviewService.name);

  constructor(
    private readonly objectStorageService: ObjectStorageService,
    private readonly imageOptimizationPipeline: ImageOptimizationPipeline,
  ) {}

  mimeNeedsWebPreview(mimeType: string): boolean {
    return MIME_NEEDS_WEB_PREVIEW.has(mimeType.trim().toLowerCase());
  }

  buildPreviewRelativeKey(storagePath: string): string {
    const relativeKey = this.toRelativeFileKey(storagePath);
    const directory = path.posix.dirname(relativeKey);
    const baseName = path.posix.basename(
      relativeKey,
      path.posix.extname(relativeKey),
    );
    const previewName = `${baseName}.preview.webp`;
    return directory === "." ? previewName : `${directory}/${previewName}`;
  }

  async ensureWebPreviewForTempUpload(input: {
    storagePath: string;
    mimeType: string;
  }): Promise<string> {
    const previewRelativeKey = this.buildPreviewRelativeKey(input.storagePath);
    const previewCompoundPath = `${STORAGE_DIRECTORIES.VEHICLES_IMAGES}/${previewRelativeKey}`;

    const existing = await this.objectStorageService.getObjectBufferByKey(
      previewCompoundPath,
    );
    if (existing) {
      return previewRelativeKey;
    }

    const sourceBuffer = await this.objectStorageService.getObjectBufferByKey(
      input.storagePath,
    );
    if (!sourceBuffer) {
      throw new Error("Archivo temporal no encontrado para generar vista previa");
    }

    const optimized = await this.imageOptimizationPipeline.execute(
      {
        buffer: sourceBuffer,
        mimeType: input.mimeType,
        objectKey: input.storagePath,
      },
      {
        maxWidth: TEMP_UPLOAD_PREVIEW_MAX_WIDTH,
        quality: TEMP_UPLOAD_PREVIEW_WEBP_QUALITY,
      },
    );

    await this.objectStorageService.putObjectToBucket(
      STORAGE_DIRECTORIES.VEHICLES_IMAGES,
      previewRelativeKey,
      optimized.buffer,
      optimized.contentType,
    );

    this.logger.log(
      `Vista previa WebP generada para temp: ${previewRelativeKey}`,
    );

    return previewRelativeKey;
  }

  async deletePreviewSiblingIfExists(storagePath: string): Promise<void> {
    const previewRelativeKey = this.buildPreviewRelativeKey(storagePath);
    const previewCompoundPath = `${STORAGE_DIRECTORIES.VEHICLES_IMAGES}/${previewRelativeKey}`;

    try {
      await this.objectStorageService.deleteObjectByKey(previewCompoundPath);
    } catch (error) {
      this.logger.warn(
        `No se pudo borrar la vista previa temp ${previewCompoundPath}: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
      );
    }
  }

  private toRelativeFileKey(storagePath: string): string {
    const prefix = `${STORAGE_DIRECTORIES.VEHICLES_IMAGES}/`;
    return storagePath.startsWith(prefix)
      ? storagePath.slice(prefix.length)
      : storagePath;
  }
}
