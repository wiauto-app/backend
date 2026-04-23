import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";

import { FileQueuePort } from "./domain/ports/file-queue.port";
import { FileStoragePort } from "./domain/ports/file-storage.port";
import { FileQueueAdapter } from "./infrastructure/adapters/file-queue.adapter";
import { MinioAdapter } from "./infrastructure/adapters/minio.adapter";
import { UPLOAD_IMAGE_QUEUE } from "./infrastructure/media.constants";
import { ImageProcessor } from "./infrastructure/processors/image.processor";
import { MinioService } from "../minio-provider/minio.service";
import { VehicleImagesPersistenceModule } from "../../vehicles/vehicle-images/vehicle-images-persistence.module";
import { OptimizeImageUseCase } from "./application/images-use-cases/optimize-image-use-case/optimize-image.use-case";
import { UploadImageUseCase } from "./application/images-use-cases/upload-image.use-case/upload-image.use-case";
import { ValidateImagesUseCase } from "./application/images-use-cases/validate-images.use-case/validate-images.use-case";
import { GenerateVideoSignedUrlController } from "./infrastructure/generate-video-signed-url/generate-video-signed-url.controller";
import { GenerateSignedUrlUseCase } from "./application/videos-use-cases/generate-signed-url-use-case/generate-signed-url.use-case";

@Module({
  controllers: [GenerateVideoSignedUrlController],
  providers: [
    MinioService,
    MinioAdapter,
    {
      provide: FileStoragePort,
      useExisting: MinioAdapter,
    },
    
    UploadImageUseCase,
    ValidateImagesUseCase,
    OptimizeImageUseCase,
    GenerateSignedUrlUseCase,
    
    FileQueueAdapter,
    ImageProcessor,
    {
      provide: FileQueuePort,
      useExisting: FileQueueAdapter,
    },
  ],
  imports: [
    BullModule.registerQueue({ name: UPLOAD_IMAGE_QUEUE }),
    VehicleImagesPersistenceModule,
  ],
  exports: [FileStoragePort, UploadImageUseCase, MinioService, FileQueueAdapter, FileQueuePort],
})
export class FileModule {}
