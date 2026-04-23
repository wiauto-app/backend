import { BadRequestException } from "@nestjs/common";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { FileStoragePort } from "../../../domain/ports/file-storage.port";
import { normalize_image_filename_for_storage } from "../../../infrastructure/utils/normalize-image-filename-for-storage";
import { ValidateImagesUseCase } from "../validate-images.use-case/validate-images.use-case";
import { OptimizeImageUseCase } from "../optimize-image-use-case/optimize-image.use-case";

@Injectable()
export class UploadImageUseCase {
  constructor(
    private readonly fileStoragePort: FileStoragePort,
    private readonly validateImagesUseCase: ValidateImagesUseCase,
    private readonly optimizeImageUseCase: OptimizeImageUseCase
  ) { }

  async execute(files: Express.Multer.File[], path: string, prefix: string): Promise<string[]> {

    const { isValid, message } = this.validateImagesUseCase.execute(files);
    if (!isValid) {
      throw new BadRequestException(message);
    }
    const optimizedImages = await this.optimizeImageUseCase.execute(files, { diferente_sizes: false });
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