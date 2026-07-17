import { BadRequestException } from "@nestjs/common";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { FileStoragePort } from "../ports/file-storage.port";
import { normalize_image_filename_for_storage } from "../utils/normalize-image-filename-for-storage";
import { ValidateImagesService } from "./validate-images.service";
import { OptimizeImageService } from "./optimize-image.service";

@Injectable()
export class UploadImageService {
  constructor(
    private readonly fileStoragePort: FileStoragePort,
    private readonly validateImagesService: ValidateImagesService,
    private readonly optimizeImageService: OptimizeImageService
  ) { }

  async execute(files: Express.Multer.File[], path: string, prefix: string): Promise<string[]> {

    const { isValid, message } = this.validateImagesService.execute(files);
    if (!isValid) {
      throw new BadRequestException(message);
    }
    const optimizedImages = await this.optimizeImageService.execute(files, { diferente_sizes: false });
    const renamedFiles = optimizedImages.map(({large}) => {
      const safe_stem = normalize_image_filename_for_storage(
        large.originalname,
        large.mimetype,
      );
      const uniqueName = this.generateUniqueName(safe_stem, prefix);
      return { ...large, originalname: uniqueName };
    });
    const urls = await this.fileStoragePort.uploadFiles(renamedFiles, path);
    return urls;
  }

  private generateUniqueName(originalname: string, prefix: string): string {
    return `${prefix}-${Date.now()}-${originalname}`;
  }
}