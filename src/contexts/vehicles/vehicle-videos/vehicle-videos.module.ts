import { BullModule } from "@nestjs/bullmq";
import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { BillingModule } from "@/src/contexts/billing/billing.module";
import { FileModule } from "@/src/contexts/shared/file/file.module";
import { PROCESS_VEHICLE_VIDEO_QUEUE } from "@/src/contexts/shared/file/media.constants";

import { VideosEntity } from "../entities/videos.entity";
import { VideoUploadController } from "./api/v1/video-upload/video-upload.controller";
import { VideoUploadSessionEntity } from "./entities/video-upload-session.entity";
import { VehicleVideoAttachService } from "./services/vehicle-video-attach.service";
import { VideoUploadService } from "./services/video-upload.service";

@Module({
  controllers: [VideoUploadController],
  providers: [VideoUploadService, VehicleVideoAttachService],
  exports: [VideoUploadService, VehicleVideoAttachService],
  imports: [
    FileModule,
    BullModule.registerQueue({ name: PROCESS_VEHICLE_VIDEO_QUEUE }),
    TypeOrmModule.forFeature([VideoUploadSessionEntity, VideosEntity]),
    forwardRef(() => BillingModule),
  ],
})
export class VehicleVideosModule {}
