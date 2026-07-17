import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";

import { FileQueuePort } from "./ports/file-queue.port";
import { FileStoragePort } from "./ports/file-storage.port";
import { TempStoragePromotionPort } from "./ports/temp-storage-promotion.port";
import { VideoProcessorPort } from "./ports/video-processor.port";
import { FileQueueAdapter } from "./clients/file-queue.adapter";
import { FfmpegAdapter } from "./clients/ffmpeg.adapter";
import { MinioAdapter } from "./clients/minio.adapter";
import { MinioImageStorageFinalizationAdapter } from "./clients/minio-image-storage-finalization.adapter";
import { FinalizeImageStoragePathService } from "./services/finalize-image-storage-path.service";
import { ImageStorageFinalizationPort } from "./ports/image-storage-finalization.port";
import { PromoteTempStoragePathsService } from "./services/promote-temp-storage-paths.service";
import { UPLOAD_IMAGE_QUEUE, UPLOAD_VIDEO_QUEUE } from "./media.constants";
import { ImageProcessor } from "./processors/image.processor";
import { VideoProcessor } from "./processors/video.processor";
import { MinioService } from "../minio-provider/minio.service";
import { VehicleImagesPersistenceModule } from "../../vehicles/vehicle-images/vehicle-images-persistence.module";
import { OptimizeImageService } from "./services/optimize-image.service";
import { UploadImageService } from "./services/upload-image.service";
import { ValidateImagesService } from "./services/validate-images.service";
import { GenerateFileSignedUrlController } from "./api/generate-file-signed-url/generate-file-signed-url.controller";
import { GenerateSignedUrlService } from "./services/generate-signed-url.service";
import { ConfirmVideoUploadController } from "./api/confirm-video-upload/confirm-video-upload.controller";
import { ConfirmVideoUploadService } from "./services/confirm-video-upload.service";
import { GenerateReadFileSignedUrlController } from "./api/generate-read-file-signed-url/generate-read-file-signed-url.controller";
import { GenerateReadFileSignedUrlService } from "./services/generate-read-file-signed-url.service";
import { RemoveFilesService } from "./services/remove-files.service";
import { RemoveFileController } from "./api/remove-file/remove-file.controller";

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

    UploadImageService,
    ValidateImagesService,
    OptimizeImageService,
    GenerateSignedUrlService,
    ConfirmVideoUploadService,
    GenerateReadFileSignedUrlService,
    RemoveFilesService,
    PromoteTempStoragePathsService,
    FinalizeImageStoragePathService,
    MinioImageStorageFinalizationAdapter,
    {
      provide: TempStoragePromotionPort,
      useExisting: MinioImageStorageFinalizationAdapter,
    },
    {
      provide: ImageStorageFinalizationPort,
      useExisting: MinioImageStorageFinalizationAdapter,
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
    UploadImageService,
    MinioService,
    FileQueueAdapter,
    FileQueuePort,
    TempStoragePromotionPort,
    ImageStorageFinalizationPort,
    PromoteTempStoragePathsService,
    FinalizeImageStoragePathService,
  ],
})
export class FileModule {}
