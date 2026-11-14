import { Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { InjectRepository } from "@nestjs/typeorm";
import { Queue } from "bullmq";
import { In, Repository } from "typeorm";

import { PROCESS_VEHICLE_IMAGE_QUEUE } from "@/src/contexts/shared/file/media.constants";
import type { ProcessVehicleImageJob } from "@/src/contexts/shared/file/processors/process-vehicle-image.processor";
import { TemporaryUploadEntity } from "@/src/contexts/shared/file/entities/temporary-upload.entity";

import { CreateVehicleService } from "../api/v1/create-vehicle/create-vehicle.service";
import { VideosEntity } from "../entities/videos.entity";
import {
  VEHICLE_POST_COMMIT_RELOCATE_IMAGE_CONCURRENCY,
  VehiclePostCommitJobData,
  VehiclePostCommitPendingImage,
} from "../queues/vehicle-post-commit.queue.constants";
import { VehicleSearchIndexer } from "../search/indexing/vehicle-search-indexer.service";
import { VehicleDetailCacheService } from "./vehicle-detail-cache.service";
import { TypeOrmVehicleRepository } from "../repositories/typeorm.vehicle-repository";
import { VehicleImagesEntity } from "../vehicle-images/entities/vehicle-images.entity";
import { RelocateVehicleImageSourceService } from "../vehicle-images/services/relocate-vehicle-image-source.service";
import { VehicleVideoAttachService } from "../vehicle-videos/services/vehicle-video-attach.service";

@Injectable()
export class VehiclePostCommitService {
  private readonly logger = new Logger(VehiclePostCommitService.name);

  constructor(
    private readonly relocate_vehicle_image_source_service: RelocateVehicleImageSourceService,
    @InjectRepository(VehicleImagesEntity)
    private readonly vehicle_images_repository: Repository<VehicleImagesEntity>,
    @InjectRepository(TemporaryUploadEntity)
    private readonly temporary_upload_repository: Repository<TemporaryUploadEntity>,
    @InjectRepository(VideosEntity)
    private readonly videos_repository: Repository<VideosEntity>,
    @InjectQueue(PROCESS_VEHICLE_IMAGE_QUEUE)
    private readonly image_queue: Queue<ProcessVehicleImageJob>,
    private readonly vehicle_video_attach_service: VehicleVideoAttachService,
    private readonly create_vehicle_service: CreateVehicleService,
    private readonly vehicle_search_indexer: VehicleSearchIndexer,
    private readonly vehicle_detail_cache: VehicleDetailCacheService,
    private readonly vehicle_repository: TypeOrmVehicleRepository,
  ) {}

  async execute(data: VehiclePostCommitJobData): Promise<void> {
    await this.relocateImages(data.vehicle_id, data.images);
    await this.relocateVideos(data.video_ids);
    await this.runSideEffects(data);

    if (data.warm_cache) {
      try {
        await this.vehicle_detail_cache.refresh(data.vehicle_id, () =>
          this.vehicle_repository.findOne(data.vehicle_id),
        );
      } catch (error) {
        this.logger.error(
          `No se pudo refrescar la caché del vehículo ${data.vehicle_id}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }

  async relocateImages(
    vehicle_id: string,
    images: VehiclePostCommitPendingImage[],
  ): Promise<void> {
    if (images.length === 0) {
      return;
    }

    const upload_ids = images.map(image => image.upload_id);
    const uploads = await this.temporary_upload_repository.findBy({
      id: In(upload_ids),
    });
    const uploads_by_id = new Map(uploads.map(upload => [upload.id, upload]));

    const process_jobs: {
      name: string;
      data: ProcessVehicleImageJob;
      opts: {
        priority: number;
        attempts: number;
        backoff: { type: "exponential"; delay: number };
      };
    }[] = [];

    for (
      let offset = 0;
      offset < images.length;
      offset += VEHICLE_POST_COMMIT_RELOCATE_IMAGE_CONCURRENCY
    ) {
      const batch = images.slice(
        offset,
        offset + VEHICLE_POST_COMMIT_RELOCATE_IMAGE_CONCURRENCY,
      );
      await Promise.all(
        batch.map(image =>
          this.relocateOneImage(
            vehicle_id,
            image,
            uploads_by_id.get(image.upload_id),
            process_jobs,
          ),
        ),
      );
    }

    if (process_jobs.length > 0) {
      try {
        await this.image_queue.addBulk(process_jobs);
      } catch (error) {
        this.logger.error(
          `No se pudieron encolar imágenes del vehículo ${vehicle_id}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }

  private async relocateOneImage(
    vehicle_id: string,
    image: VehiclePostCommitPendingImage,
    temp_upload: TemporaryUploadEntity | undefined,
    process_jobs: {
      name: string;
      data: ProcessVehicleImageJob;
      opts: {
        priority: number;
        attempts: number;
        backoff: { type: "exponential"; delay: number };
      };
    }[],
  ): Promise<void> {
    if (!temp_upload) {
      await this.vehicle_images_repository.update(image.image_id, {
        status: "failed",
        failure_reason: "No se encontró el upload temporal de la imagen",
      });
      return;
    }

    try {
      const relocated = await this.relocate_vehicle_image_source_service.execute(
        {
          vehicleId: vehicle_id,
          imageId: image.image_id,
          tempStoragePath: temp_upload.storage_path,
          mimeType: temp_upload.mime_type,
        },
      );

      await this.vehicle_images_repository.update(image.image_id, {
        source_path: relocated.sourcePath,
      });

      process_jobs.push({
        name: `process-vehicle-image-${image.image_id}`,
        data: {
          image_id: image.image_id,
          vehicle_id,
          source_path: relocated.sourcePath,
          output_key: relocated.outputKey,
        },
        opts: {
          priority: image.order === 0 ? 1 : 5,
          attempts: 3,
          backoff: { type: "exponential", delay: 2000 },
        },
      });
    } catch (relocate_error) {
      const reason =
        relocate_error instanceof Error
          ? relocate_error.message
          : "No se pudo reubicar la imagen temporal";
      await this.vehicle_images_repository.update(image.image_id, {
        status: "failed",
        failure_reason: reason,
      });
      this.logger.error(
        `No se pudo reubicar la imagen ${image.image_id} del vehículo ${vehicle_id}: ${reason}`,
      );
    }
  }

  private async relocateVideos(video_ids: string[]): Promise<void> {
    if (video_ids.length === 0) {
      return;
    }

    const videos = await this.videos_repository.findBy({ id: In(video_ids) });
    if (videos.length > 0) {
      await this.vehicle_video_attach_service.relocateAndEnqueue(videos);
    }
  }

  private async runSideEffects(data: VehiclePostCommitJobData): Promise<void> {
    switch (data.kind) {
      case "create_publish":
        await this.create_vehicle_service.runPublishSideEffects({
          vehicle_id: data.vehicle_id,
          publisher_profile_id: data.publisher_profile_id!,
          expires_at: new Date(data.expires_at!),
          now: new Date(data.now!),
        });
        break;
      case "create_draft":
        await this.create_vehicle_service.runDraftRegistrationSideEffects({
          vehicle_id: data.vehicle_id,
          expires_at: new Date(data.expires_at!),
          now: new Date(data.now!),
        });
        break;
      case "update":
        if (data.reindex) {
          await this.vehicle_search_indexer.indexVehicle(data.vehicle_id);
        }
        break;
      default:
        break;
    }
  }
}