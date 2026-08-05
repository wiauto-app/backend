import path from "node:path";

import { BadRequestException } from "@nestjs/common";

import { envs } from "@/src/common/envs";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";

import { MinioService } from "../../minio-provider/minio.service";
import { CONTENT_TYPES } from "../ports/file-storage.port";
import {
  convertHeicToJpegBuffer,
  shouldConvertHeic,
} from "../utils/heic-image.util";
import { OptimizeImageService } from "./optimize-image.service";

const VEHICLES_IMAGES_BUCKET = "vehicles-images";
const TEMP_VEHICLE_GALLERY_PREFIX = "temp/vehicle-gallery";

interface UploadTempVehicleImageResult {
  path: string;
  preview_url: string;
}

@Injectable()
export class UploadTempVehicleImageService {
  constructor(
    private readonly optimizeImageService: OptimizeImageService,
    private readonly minioService: MinioService,
  ) {}

  async execute(file: Express.Multer.File): Promise<UploadTempVehicleImageResult> {
    if (!file) {
      throw new BadRequestException("Debes enviar una imagen en el campo file");
    }

    const prepared = await this.prepareForOptimization(file);

    let optimizedLarge: Express.Multer.File;
    try {
      const [optimized] = await this.optimizeImageService.execute([prepared], {
        diferente_sizes: false,
      });
      optimizedLarge = optimized.large;
    } catch {
      throw new BadRequestException(
        "No se pudo procesar la imagen. Prueba con otro formato o comprueba que el archivo no esté dañado.",
      );
    }

    const objectKey = `${TEMP_VEHICLE_GALLERY_PREFIX}/${uuidv4()}.webp`;

    await this.minioService.putObjectToBucket(
      VEHICLES_IMAGES_BUCKET,
      objectKey,
      optimizedLarge.buffer,
      CONTENT_TYPES.IMAGE_WEBP,
    );

    const storagePath = `${VEHICLES_IMAGES_BUCKET}/${objectKey}`;
    const endpoint = envs.MINIO_ENDPOINT.replace(/\/$/, "");
    const preview_url = `${endpoint}/${storagePath}`;

    return { path: storagePath, preview_url };
  }

  /**
   * HEIC/HEIF: Sharp local suele fallar sin codec libheif.
   * Convertimos a JPEG con `heic-convert` y luego Sharp → WebP.
   */
  private async prepareForOptimization(
    file: Express.Multer.File,
  ): Promise<Express.Multer.File> {
    if (!shouldConvertHeic(file)) {
      return file;
    }

    try {
      const jpegBuffer = await convertHeicToJpegBuffer(file.buffer);
      const parsed = path.parse(file.originalname || "image.heic");
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
    } catch {
      throw new BadRequestException(
        "No se pudo leer el archivo HEIC/HEIF. Convierte la foto a JPEG o PNG e inténtalo de nuevo.",
      );
    }
  }
}
