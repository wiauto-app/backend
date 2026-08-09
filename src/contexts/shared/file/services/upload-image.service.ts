import path from "node:path";

import { BadRequestException, Logger } from "@nestjs/common";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { ObjectStorageService } from "@/src/contexts/shared/object-storage/object-storage.service";
import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";

import { CONTENT_TYPES } from "../ports/file-storage.port";
import {
  convertAvifToJpegBuffer,
  shouldConvertAvif,
} from "../utils/avif-image.util";
import {
  convertHeicToJpegBuffer,
  shouldConvertHeic,
} from "../utils/heic-image.util";
import { normalize_image_filename_for_storage } from "../utils/normalize-image-filename-for-storage";
import { OptimizeImageService } from "./optimize-image.service";
import { ValidateImagesService } from "./validate-images.service";

export type UploadImageFileNameStrategy =
  | "uuid"
  | "prefixTimestamp"
  | "originalSafe";

export interface UploadImageOptimizeOptions {
  enabled?: boolean;
  maxWidth?: number;
  quality?: number;
  multipleSizes?: boolean;
  /** Preconversión HEIC/HEIF → JPEG antes de Sharp → WebP. @default true */
  convertHeic?: boolean;
  /** Preconversión AVIF → JPEG antes de Sharp → WebP. @default true */
  convertAvif?: boolean;
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
    private readonly optimizeImageService: OptimizeImageService,
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
    const shouldConvertHeicFlag = optimizeOptions.convertHeic !== false;
    const shouldConvertAvifFlag = optimizeOptions.convertAvif !== false;

    const preparedFiles: Express.Multer.File[] = [];
    for (const file of files) {
      preparedFiles.push(
        await this.prepareForOptimization(file, {
          convertAvif: shouldConvertAvifFlag,
          convertHeic: shouldConvertHeicFlag,
        }),
      );
    }

    let workingFiles = preparedFiles;
    if (shouldOptimize) {
      try {
        const optimized = await this.optimizeImageService.execute(preparedFiles, {
          diferente_sizes: optimizeOptions.multipleSizes === true,
          maxWidth: optimizeOptions.maxWidth,
          quality: optimizeOptions.quality,
        });
        workingFiles = optimized.map(({ large }) => large);
      } catch {
        throw new BadRequestException(
          "No se pudo procesar la imagen. Prueba con otro formato o comprueba que el archivo no esté dañado.",
        );
      }
    }

    const keyPrefix = options.keyPrefix.replaceAll(/^\/+|\/+$/g, "");
    const strategy = options.fileNameStrategy ?? "prefixTimestamp";
    const results: UploadImageResult[] = [];

    for (const file of workingFiles) {
      const objectKey = this.buildObjectKey(
        file,
        keyPrefix,
        strategy,
        options.fileNamePrefix,
      );
      const contentType = file.mimetype || CONTENT_TYPES.IMAGE_WEBP;
      const body = Buffer.isBuffer(file.buffer)
        ? file.buffer
        : Buffer.from(file.buffer as Uint8Array);

      await this.objectStorageService.putObjectToBucket(
        options.directory,
        objectKey,
        body,
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
    fileNamePrefix?: string,
  ): string {
    if (strategy === "uuid") {
      const ext =
        path.extname(file.originalname).toLowerCase() ||
        (file.mimetype === CONTENT_TYPES.IMAGE_WEBP ? ".webp" : ".jpg");
      return `${keyPrefix}/${uuidv4()}${ext}`;
    }

    const safeStem = normalize_image_filename_for_storage(
      file.originalname,
      file.mimetype,
    );

    if (strategy === "originalSafe") {
      return `${keyPrefix}/${safeStem}`;
    }

    const prefix = fileNamePrefix?.trim();
    return `${keyPrefix}/${prefix}-${Date.now()}-${safeStem}`;
  }

  /**
   * AVIF / HEIC/HEIF → JPEG intermedio; luego OptimizeImageService → WebP.
   * AVIF se evalúa antes que HEIC porque comparten contenedor ISO-BMFF (mif1).
   */
  private async prepareForOptimization(
    file: Express.Multer.File,
    flags: { convertAvif: boolean; convertHeic: boolean },
  ): Promise<Express.Multer.File> {
    if (flags.convertAvif && shouldConvertAvif(file)) {
      return this.convertBufferToJpegMulterFile(file, "image.avif", async () =>
        convertAvifToJpegBuffer(file.buffer),
      );
    }

    if (flags.convertHeic && shouldConvertHeic(file)) {
      return this.convertBufferToJpegMulterFile(file, "image.heic", async () =>
        convertHeicToJpegBuffer(file.buffer),
      );
    }

    return file;
  }

  private async convertBufferToJpegMulterFile(
    file: Express.Multer.File,
    fallbackName: string,
    convert: () => Promise<Buffer>,
  ): Promise<Express.Multer.File> {
    try {
      const jpegBuffer = await convert();
      const parsed = path.parse(file.originalname || fallbackName);
      const originalname = path.format({
        ...parsed,
        base: undefined,
        ext: ".jpg",
      });

      return {
        ...file,
        buffer: jpegBuffer,
        size: jpegBuffer.length,
        mimetype: CONTENT_TYPES.IMAGE_JPEG,
        originalname,
      };
    } catch (error) {
      this.logger.error(`Error al preconvertir imagen (${fallbackName})`, error);
      const formatLabel = fallbackName.includes("avif") ? "AVIF" : "HEIC/HEIF";
      throw new BadRequestException(
        `No se pudo leer el archivo ${formatLabel}. Convierte la foto a JPEG o PNG e inténtalo de nuevo.`,
      );
    }
  }
}
