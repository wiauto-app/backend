import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Queue } from "bullmq";
import { EntityManager, Repository } from "typeorm";

import { envs } from "@/src/common/envs";
import { PROCESS_VEHICLE_VIDEO_QUEUE } from "@/src/contexts/shared/file/media.constants";
import { ObjectStorageService } from "@/src/contexts/shared/object-storage/object-storage.service";
import { STORAGE_DIRECTORIES } from "@/src/contexts/shared/file/storage-directories";
import { resolveObjectKeyFromStored } from "@/src/contexts/shared/file/storage-directories";
import { MultipartObjectStorageService } from "@/src/contexts/shared/object-storage/multipart-object-storage.service";

import {
  VEHICLE_VIDEO_STATUS,
  VideosEntity,
} from "../../entities/videos.entity";
import type { VideoUploadSessionEntity } from "../entities/video-upload-session.entity";

export interface ProcessVehicleVideoJob {
  video_id: string;
  vehicle_id: string;
  source_key: string;
}

export interface NewVehicleVideoInput {
  session: VideoUploadSessionEntity;
  order: number;
}

/** Prefijo de todos los derivados de un vídeo en R2. */
export const vehicleVideoPrefix = (vehicle_id: string, video_id: string) =>
  `${STORAGE_DIRECTORIES.VEHICLES_VIDEOS}/${vehicle_id}/${video_id}`;

export const vehicleVideoOutputKeys = (vehicle_id: string, video_id: string) => {
  const prefix = vehicleVideoPrefix(vehicle_id, video_id);
  return {
    optimized: `${prefix}/optimized.mp4`,
    thumbnail_webp: `${prefix}/thumbnail.webp`,
    thumbnail_jpeg: `${prefix}/thumbnail.jpg`,
  };
};

const extensionOf = (key: string): string => {
  const match = /\.[a-z0-9]+$/i.exec(key);
  return match ? match[0].toLowerCase() : "";
};

const ENQUEUE_TIMEOUT_MS = 10_000;

/**
 * Asocia sesiones multipart completadas a un vehículo: crea filas
 * `vehicle_videos`, mueve el original a su carpeta definitiva y encola FFmpeg.
 */
@Injectable()
export class VehicleVideoAttachService {
  private readonly logger = new Logger(VehicleVideoAttachService.name);

  constructor(
    @InjectRepository(VideosEntity)
    private readonly videos_repository: Repository<VideosEntity>,
    private readonly storage: MultipartObjectStorageService,
    @InjectQueue(PROCESS_VEHICLE_VIDEO_QUEUE)
    private readonly video_queue: Queue<ProcessVehicleVideoJob>,
    private readonly object_storage_service: ObjectStorageService,
  ) {}

  /** Debe ejecutarse dentro de la transacción del vehículo. */
  async createRows(
    manager: EntityManager,
    vehicle_id: string,
    inputs: NewVehicleVideoInput[],
  ): Promise<VideosEntity[]> {
    if (inputs.length === 0) {
      return [];
    }
    return manager.save(
      VideosEntity,
      inputs.map(({ session, order }) =>
        manager.create(VideosEntity, {
          vehicle_id,
          order,
          status: VEHICLE_VIDEO_STATUS.UPLOADED,
          url: null,
          thumbnail_url: null,
          source_key: session.storage_key,
          mime_type: session.mime_type,
          original_size: session.size_bytes,
          duration_s: session.duration_s,
          width: session.width,
          height: session.height,
        }),
      ),
    );
  }

  /**
   * Tras el commit: reubica cada original y encola su procesamiento.
   * Un fallo en un vídeo lo marca `failed` sin tumbar la publicación.
   */
  async relocateAndEnqueue(videos: VideosEntity[]): Promise<void> {
    const jobs: {
      name: string;
      data: ProcessVehicleVideoJob;
      opts: {
        jobId: string;
        attempts: number;
        backoff: { type: "exponential"; delay: number };
        removeOnComplete: number;
        removeOnFail: number;
      };
    }[] = [];

    for (const video of videos) {
      const temp_key = video.source_key;
      if (!temp_key) {
        continue;
      }
      const dest_key = `${vehicleVideoPrefix(video.vehicle_id, video.id)}/original${extensionOf(temp_key)}`;

      try {
        await this.storage.copyObject(temp_key, dest_key);
        // Sin FFmpeg (temporal): el original queda publicado tal cual
        await this.videos_repository.update(
          video.id,
          envs.VIDEO_PROCESSING_ENABLED
            ? { source_key: dest_key }
            : {
              source_key: dest_key,
              status: VEHICLE_VIDEO_STATUS.READY,
              url: this.object_storage_service.buildPublicUrl(dest_key),
              failure_reason: null,
            },
        );
        try {
          await this.storage.deleteObject(temp_key);
        } catch (error) {
          // La limpieza horaria no lo verá (sesión consumida): solo se registra
          this.logger.warn(
            `No se pudo borrar el vídeo temporal ${temp_key}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }

        if (!envs.VIDEO_PROCESSING_ENABLED) {
          continue;
        }
        jobs.push({
          name: `process-vehicle-video-${video.id}`,
          data: {
            video_id: video.id,
            vehicle_id: video.vehicle_id,
            source_key: dest_key,
          },
          opts: {
            // Idempotencia: el mismo vídeo nunca se encola dos veces a la vez
            jobId: video.id,
            attempts: 3,
            backoff: { type: "exponential", delay: 30_000 },
            removeOnComplete: 100,
            removeOnFail: 100,
          },
        });
      } catch (error) {
        const reason =
          error instanceof Error
            ? error.message
            : "No se pudo reubicar el vídeo temporal";
        await this.videos_repository.update(video.id, {
          status: VEHICLE_VIDEO_STATUS.FAILED,
          failure_reason: reason,
        });
        this.logger.error(
          `No se pudo reubicar el vídeo ${video.id} del vehículo ${video.vehicle_id}: ${reason}`,
        );
      }
    }

    if (jobs.length === 0) {
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        this.video_queue.addBulk(jobs),
        new Promise((_, reject) => {
          timer = setTimeout(
            () => {
              reject(new Error(`Encolar vídeos superó ${ENQUEUE_TIMEOUT_MS}ms`));
            },
            ENQUEUE_TIMEOUT_MS,
          );
        }),
      ]);
    } catch (error) {
      // Los vídeos quedan `uploaded`; la limpieza los reencola
      this.logger.error(
        "No se pudieron encolar los vídeos del vehículo",
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }

  /** Borra en segundo plano todos los objetos R2 de los vídeos eliminados. */
  deleteObjectsInBackground(videos: VideosEntity[]): void {
    const keys = new Set<string>();
    for (const video of videos) {
      const outputs = vehicleVideoOutputKeys(video.vehicle_id, video.id);
      keys.add(outputs.optimized);
      keys.add(outputs.thumbnail_webp);
      keys.add(outputs.thumbnail_jpeg);
      if (video.source_key) {
        keys.add(video.source_key);
      }
      // Vídeos legacy: `url` guarda el pathname del objeto subido tal cual
      if (video.url) {
        try {
          keys.add(resolveObjectKeyFromStored(video.url));
        } catch {
          // URL no resoluble: nada que borrar
        }
      }
    }

    void Promise.allSettled(
      [...keys].map((key) => this.storage.deleteObject(key)),
    ).then((results) => {
      const failed = results.filter((result) => result.status === "rejected");
      if (failed.length > 0) {
        this.logger.warn(
          `No se pudieron borrar ${failed.length} objetos de vídeos eliminados`,
        );
      }
    });
  }
}
