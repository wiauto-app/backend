import path from "node:path";

import { BadRequestException, Logger } from "@nestjs/common";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { ObjectStorageService } from "@/src/contexts/shared/object-storage/object-storage.service";
import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";

import { CONTENT_TYPES } from "../ports/file-storage.port";
import { normalize_image_filename_for_storage } from "../utils/normalize-image-filename-for-storage";
import { ValidateImagesService } from "./validate-images.service";
import { ImageOptimizationPipeline } from "../image-formats/image-optimization-pipeline.service";

export type UploadImageFileNameStrategy =
  | "uuid"
  | "prefixTimestamp"
  | "originalSafe";

export interface UploadImageOptimizeOptions {
  enabled?: boolean;
  maxWidth?: number;
  quality?: number;
  multipleSizes?: boolean;
}

export interface UploadImageOptions {
  /** Directorio lógico (p. ej. vehicles-images), no bucket R2. */
  directory: string;
  keyPrefix: string;
  fileNameStrategy?: UploadImageFileNameStrategy;
  fileNamePrefix?: string;
  optimize?: UploadImageOptimizeOptions;
  returnPreviewUrl?: boolean;
  /** Documenta uso con promote temp→final; no cambia el flujo por sí solo. */
  isTemp?: boolean;
}

export interface UploadImageResult {
  path: string;
  previewUrl?: string;
}

@Injectable()
export class UploadImageService {
  private readonly logger = new Logger(UploadImageService.name);

  constructor(
    private readonly objectStorageService: ObjectStorageService,
    private readonly validateImagesService: ValidateImagesService,
    private readonly imageOptimizationPipeline: ImageOptimizationPipeline,
  ) {}

  async execute(
    files: Express.Multer.File[],
    options: UploadImageOptions,
  ): Promise<UploadImageResult[]> {
    if (files.length === 0) {
      throw new BadRequestException("Debes enviar al menos una imagen");
    }

    const { isValid, message } = this.validateImagesService.execute(files);
    if (!isValid) {
      throw new BadRequestException(message);
    }

    const optimizeOptions = options.optimize ?? { enabled: true };
    const shouldOptimize = optimizeOptions.enabled !== false;

    const keyPrefix = options.keyPrefix.replaceAll(/^\/+|\/+$/g, "");
    const strategy = options.fileNameStrategy ?? "prefixTimestamp";
    const results: UploadImageResult[] = [];

    for (const file of files) {
      const body = Buffer.isBuffer(file.buffer)
        ? file.buffer
        : Buffer.from(file.buffer as Uint8Array);

      let uploadBuffer = body;
      let contentType = file.mimetype || CONTENT_TYPES.IMAGE_WEBP;

      if (shouldOptimize) {
        try {
          const optimized = await this.imageOptimizationPipeline.execute(
            {
              buffer: body,
              mimeType: file.mimetype,
              objectKey: file.originalname,
            },
            {
              maxWidth: optimizeOptions.maxWidth,
              quality: optimizeOptions.quality,
            },
          );
          uploadBuffer = optimized.buffer;
          contentType = optimized.contentType;
        } catch (error) {
          this.logger.error("Error al optimizar imagen Multer", error);
          throw new BadRequestException(
            "No se pudo procesar la imagen. Prueba con otro formato o comprueba que el archivo no esté dañado.",
          );
        }
      }

      const objectKey = this.buildObjectKey(
        file,
        keyPrefix,
        strategy,
        options.fileNamePrefix,
        shouldOptimize,
      );

      await this.objectStorageService.putObjectToBucket(
        options.directory,
        objectKey,
        uploadBuffer,
        contentType,
      );

      const storagePath = `${options.directory}/${objectKey}`;
      const result: UploadImageResult = { path: storagePath };
      if (options.returnPreviewUrl) {
        result.previewUrl = this.objectStorageService.buildPublicUrl(
          options.directory,
          objectKey,
        );
      }
      results.push(result);
    }

    return results;
  }

  private buildObjectKey(
    file: Express.Multer.File,
    keyPrefix: string,
    strategy: UploadImageFileNameStrategy,
    fileNamePrefix: string | undefined,
    optimizedToWebp: boolean,
  ): string {
    if (strategy === "uuid") {
      const ext =
        optimizedToWebp
          ? ".webp"
          : path.extname(file.originalname).toLowerCase() ||
            (file.mimetype === CONTENT_TYPES.IMAGE_WEBP ? ".webp" : ".jpg");
      return `${keyPrefix}/${uuidv4()}${ext}`;
    }

    const safeStem = normalize_image_filename_for_storage(
      file.originalname,
      optimizedToWebp ? CONTENT_TYPES.IMAGE_WEBP : file.mimetype,
    );

    if (strategy === "originalSafe") {
      return `${keyPrefix}/${safeStem}`;
    }

    const prefix = fileNamePrefix?.trim();
    return `${keyPrefix}/${prefix}-${Date.now()}-${safeStem}`;
  }
}
