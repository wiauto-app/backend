import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { TypeOrmModule } from "@nestjs/typeorm";

import { FileQueuePort } from "./ports/file-queue.port";
import { FileStoragePort } from "./ports/file-storage.port";
import { TempStoragePromotionPort } from "./ports/temp-storage-promotion.port";
import { FileQueueAdapter } from "./clients/file-queue.adapter";
import { R2StorageAdapter } from "./clients/r2-storage.adapter";
import { R2ImageStorageFinalizationAdapter } from "./clients/r2-image-storage-finalization.adapter";
import { FinalizeImageStoragePathService } from "./services/finalize-image-storage-path.service";
import { ImageStorageFinalizationPort } from "./ports/image-storage-finalization.port";
import { PromoteTempStoragePathsService } from "./services/promote-temp-storage-paths.service";
import {
  UPLOAD_IMAGE_QUEUE,
  PROCESS_VEHICLE_IMAGE_QUEUE,
  PROCESS_VEHICLE_VIDEO_QUEUE,
} from "./media.constants";
import { envs } from "@/src/common/envs";
import { ImageProcessor } from "./processors/image.processor";
import { ProcessVehicleImageProcessor } from "./processors/process-vehicle-image.processor";
import { ProcessVehicleVideoProcessor } from "./processors/process-vehicle-video.processor";
import { MultipartObjectStorageService } from "../object-storage/multipart-object-storage.service";
import { VideosEntity } from "../../vehicles/entities/videos.entity";
import { VideoUploadSessionEntity } from "../../vehicles/vehicle-videos/entities/video-upload-session.entity";
import { ObjectStorageService } from "../object-storage/object-storage.service";
import { VehicleImagesPersistenceModule } from "../../vehicles/vehicle-images/vehicle-images-persistence.module";
import { VehicleImagesEntity } from "../../vehicles/vehicle-images/entities/vehicle-images.entity";
import { OptimizeImageService } from "./services/optimize-image.service";
import { ImageOptimizationPipeline } from "./image-formats/image-optimization-pipeline.service";
import { UploadImageService } from "./services/upload-image.service";
import { UploadVideoService } from "./services/upload-video.service";
import { UploadFileService } from "./services/upload-file.service";
import { ValidateImagesService } from "./services/validate-images.service";
import { GenerateFileSignedUrlController } from "./api/generate-file-signed-url/generate-file-signed-url.controller";
import { GenerateSignedUrlService } from "./services/generate-signed-url.service";
import { ConfirmVideoUploadController } from "./api/confirm-video-upload/confirm-video-upload.controller";
import { ConfirmVideoUploadService } from "./services/confirm-video-upload.service";
import { GenerateReadFileSignedUrlController } from "./api/generate-read-file-signed-url/generate-read-file-signed-url.controller";
import { GenerateReadFileSignedUrlService } from "./services/generate-read-file-signed-url.service";
import { RemoveFilesService } from "./services/remove-files.service";
import { RemoveFileController } from "./api/remove-file/remove-file.controller";
import { UploadTempVehicleImageController } from "./api/upload-temp-vehicle-image/upload-temp-vehicle-image.controller";
import { UploadTempVehicleImageService } from "./services/upload-temp-vehicle-image.service";
import { ImageValidationPipe } from "./pipes/image-validation.pipe";
import { CleanupAbandonedTempUploadsService } from "./services/cleanup-abandoned-temp-uploads.service";
import { CleanupVideoUploadsService } from "./services/cleanup-video-uploads.service";
import { TempUploadCleanupProcessor } from "./queues/temp-upload-cleanup.processor";
import { TempUploadCleanupBootstrapService } from "./queues/temp-upload-cleanup-bootstrap.service";
import { TEMP_UPLOAD_CLEANUP_QUEUE } from "./queues/temp-upload-cleanup.queue.constants";
import { TemporaryUploadEntity } from "./entities/temporary-upload.entity";
import { VehicleDetailCacheService } from "../../vehicles/services/vehicle-detail-cache.service";
import { ImageFormatRegistry } from "./image-formats/image-format-registry.service";

@Module({
  controllers: [
    GenerateFileSignedUrlController,
    ConfirmVideoUploadController,
    GenerateReadFileSignedUrlController,
    RemoveFileController,
    UploadTempVehicleImageController,
  ],
  providers: [
    ObjectStorageService,
    MultipartObjectStorageService,
    R2StorageAdapter,
    {
      provide: FileStoragePort,
      useExisting: R2StorageAdapter,
    },

    UploadImageService,
    UploadVideoService,
    UploadFileService,
    ValidateImagesService,
    OptimizeImageService,
    ImageOptimizationPipeline,
    ImageFormatRegistry,
    GenerateSignedUrlService,
    ConfirmVideoUploadService,
    GenerateReadFileSignedUrlService,
    RemoveFilesService,
    UploadTempVehicleImageService,
    ImageValidationPipe,
    PromoteTempStoragePathsService,
    FinalizeImageStoragePathService,
    R2ImageStorageFinalizationAdapter,
    {
      provide: TempStoragePromotionPort,
      useExisting: R2ImageStorageFinalizationAdapter,
    },
    {
      provide: ImageStorageFinalizationPort,
      useExisting: R2ImageStorageFinalizationAdapter,
    },

    FileQueueAdapter,
    ImageProcessor,
    ProcessVehicleImageProcessor,
    // FFmpeg solo en procesos worker (o `all` en local), nunca en la API
    // Desactivable con VIDEO_PROCESSING_ENABLED=false (se sirve el original)
    ...(envs.APP_ROLE === "api" || !envs.VIDEO_PROCESSING_ENABLED
      ? []
      : [ProcessVehicleVideoProcessor]),
    VehicleDetailCacheService,
    {
      provide: FileQueuePort,
      useExisting: FileQueueAdapter,
    },

    CleanupAbandonedTempUploadsService,
    CleanupVideoUploadsService,
    TempUploadCleanupProcessor,
    TempUploadCleanupBootstrapService,
  ],
  imports: [
    BullModule.registerQueue({ name: UPLOAD_IMAGE_QUEUE }),
    BullModule.registerQueue({ name: PROCESS_VEHICLE_IMAGE_QUEUE }),
    BullModule.registerQueue({ name: TEMP_UPLOAD_CLEANUP_QUEUE }),
    BullModule.registerQueue({ name: PROCESS_VEHICLE_VIDEO_QUEUE }),
    VehicleImagesPersistenceModule,
    TypeOrmModule.forFeature([
      VehicleImagesEntity,
      TemporaryUploadEntity,
      VideosEntity,
      VideoUploadSessionEntity,
    ]),
  ],
  exports: [
    FileStoragePort,
    UploadImageService,
    UploadVideoService,
    UploadFileService,
    ObjectStorageService,
    MultipartObjectStorageService,
    RemoveFilesService,
    FileQueueAdapter,
    FileQueuePort,
    TempStoragePromotionPort,
    ImageStorageFinalizationPort,
    PromoteTempStoragePathsService,
    FinalizeImageStoragePathService,
    ImageOptimizationPipeline,
    ImageFormatRegistry,
  ],
})
export class FileModule {}
