import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";

import { FileQueuePort } from "./domain/ports/file-queue.port";
import { FileStoragePort } from "./domain/ports/file-storage.port";
import { TempStoragePromotionPort } from "./domain/ports/temp-storage-promotion.port";
import { VideoProcessorPort } from "./domain/ports/video-processor.port";
import { FileQueueAdapter } from "./infrastructure/adapters/file-queue.adapter";
import { FfmpegAdapter } from "./infrastructure/adapters/ffmpeg.adapter";
import { MinioAdapter } from "./infrastructure/adapters/minio.adapter";
import { MinioTempStoragePromotionAdapter } from "./infrastructure/adapters/minio-temp-storage-promotion.adapter";
import { PromoteTempStoragePathsUseCase } from "./application/promote-temp-storage-paths-use-case/promote-temp-storage-paths.use-case";
import { UPLOAD_IMAGE_QUEUE, UPLOAD_VIDEO_QUEUE } from "./infrastructure/media.constants";
import { ImageProcessor } from "./infrastructure/processors/image.processor";
import { VideoProcessor } from "./infrastructure/processors/video.processor";
import { MinioService } from "../minio-provider/minio.service";
import { VehicleImagesPersistenceModule } from "../../vehicles/vehicle-images/vehicle-images-persistence.module";
import { OptimizeImageUseCase } from "./application/images-use-cases/optimize-image-use-case/optimize-image.use-case";
import { UploadImageUseCase } from "./application/images-use-cases/upload-image.use-case/upload-image.use-case";
import { ValidateImagesUseCase } from "./application/images-use-cases/validate-images.use-case/validate-images.use-case";
import { GenerateFileSignedUrlController } from "./infrastructure/http-api/generate-file-signed-url/generate-file-signed-url.controller";
import { GenerateSignedUrlUseCase } from "./application/videos-use-cases/generate-signed-url-use-case/generate-signed-url.use-case";
import { ConfirmVideoUploadController } from "./infrastructure/http-api/confirm-video-upload/confirm-video-upload.controller";
import { ConfirmVideoUploadUseCase } from "./application/videos-use-cases/confirm-video-upload-use-case/confirm-video-upload.use-case";
import { GenerateReadFileSignedUrlController } from "./infrastructure/http-api/generate-read-file-signed-url/generate-read-file-signed-url.controller";
import { GenerateReadFileSignedUrlUseCase } from "./application/files-use-cases/files-use-cases/files-use-cases/generate-read-file-signed-url.use-case";
import { RemoveFilesUseCase } from "./application/images-use-cases/remove-files-use-case/remove-files.use-case";
import { RemoveFileController } from "./infrastructure/http-api/remove-file/remove-file.controller";

@Module({
  controllers: [
    GenerateFileSignedUrlController,
    ConfirmVideoUploadController,
    GenerateReadFileSignedUrlController,
    RemoveFileController,
  ],
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
    ConfirmVideoUploadUseCase,
    GenerateReadFileSignedUrlUseCase,
    RemoveFilesUseCase,
    PromoteTempStoragePathsUseCase,
    MinioTempStoragePromotionAdapter,
    {
      provide: TempStoragePromotionPort,
      useExisting: MinioTempStoragePromotionAdapter,
    },

    FileQueueAdapter,
    ImageProcessor,
    FfmpegAdapter,
    {
      provide: VideoProcessorPort,
      useExisting: FfmpegAdapter,
    },
    VideoProcessor,
    {
      provide: FileQueuePort,
      useExisting: FileQueueAdapter,
    },
  ],
  imports: [
    BullModule.registerQueue({ name: UPLOAD_IMAGE_QUEUE }),
    BullModule.registerQueue({ name: UPLOAD_VIDEO_QUEUE }),
    VehicleImagesPersistenceModule,
  ],
  exports: [
    FileStoragePort,
    UploadImageUseCase,
    MinioService,
    FileQueueAdapter,
    FileQueuePort,
    TempStoragePromotionPort,
    PromoteTempStoragePathsUseCase,
  ],
})
export class FileModule {}
