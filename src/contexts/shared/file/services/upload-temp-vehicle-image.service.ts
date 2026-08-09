import { BadRequestException } from "@nestjs/common";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { STORAGE_DIRECTORIES } from "../storage-directories";
import { UploadImageService } from "./upload-image.service";

const TEMP_VEHICLE_GALLERY_PREFIX = "temp/vehicle-gallery";

interface UploadTempVehicleImageResult {
  path: string;
  preview_url: string;
}

@Injectable()
export class UploadTempVehicleImageService {
  constructor(private readonly uploadImageService: UploadImageService) {}

  async execute(file: Express.Multer.File): Promise<UploadTempVehicleImageResult> {
    if (!file) {
      throw new BadRequestException("Debes enviar una imagen en el campo file");
    }

    const [result] = await this.uploadImageService.execute([file], {
      directory: STORAGE_DIRECTORIES.VEHICLES_IMAGES,
      keyPrefix: TEMP_VEHICLE_GALLERY_PREFIX,
      fileNameStrategy: "uuid",
      optimize: {
        enabled: true,
        convertHeic: true,
        convertAvif: true,
        multipleSizes: false,
      },
      returnPreviewUrl: true,
      isTemp: true,
    });

    return {
      path: result.path,
      preview_url: result.previewUrl!,
    };
  }
}
