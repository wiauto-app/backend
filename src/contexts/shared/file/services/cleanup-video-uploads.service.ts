import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Queue } from "bullmq";
import { In, LessThan, Repository } from "typeorm";

import {
  VEHICLE_VIDEO_STATUS,
  VideosEntity,
} from "@/src/contexts/vehicles/entities/videos.entity";
import {
  VIDEO_UPLOAD_SESSION_STATUS,
  VideoUploadSessionEntity,
} from "@/src/contexts/vehicles/vehicle-videos/entities/video-upload-session.entity";
import type { ProcessVehicleVideoJob } from "@/src/contexts/vehicles/vehicle-videos/services/vehicle-video-attach.service";
import { envs } from "@/src/common/envs";
import { MultipartObjectStorageService } from "../../object-storage/multipart-object-storage.service";
import { ObjectStorageService } from "../../object-storage/object-storage.service";
import { PROCESS_VEHICLE_VIDEO_QUEUE } from "../media.constants";

export interface VideoCleanupStats {
  sessions_expired: number;
  videos_published_original: number;
  videos_requeued: number;
  videos_failed: number;
  errors: number;
}

const BATCH_SIZE = 200;
/** Un vídeo `uploaded`/`processing` sin cambios en este tiempo se considera atascado. */
const STUCK_VIDEO_MS = 60 * 60 * 1000;
/** Pasado este tiempo atascado ya no se reintenta: se marca `failed`. */
const GIVE_UP_VIDEO_MS = 24 * 60 * 60 * 1000;

/**
 * Limpieza horaria de vídeos:
 * - Sesiones multipart abiertas caducadas → AbortMultipartUpload.
 * - Vídeos subidos que nunca se asociaron a un anuncio → borrar objeto.
 * - Vídeos atascados (cola caída, worker reiniciado) → reencolar o `failed`.
 */
@Injectable()
export class CleanupVideoUploadsService {
  private readonly logger = new Logger(CleanupVideoUploadsService.name);

  constructor(
    @InjectRepository(VideoUploadSessionEntity)
    private readonly sessions_repository: Repository<VideoUploadSessionEntity>,
    @InjectRepository(VideosEntity)
    private readonly videos_repository: Repository<VideosEntity>,
    private readonly storage: MultipartObjectStorageService,
    @InjectQueue(PROCESS_VEHICLE_VIDEO_QUEUE)
    private readonly video_queue: Queue<ProcessVehicleVideoJob>,
    private readonly object_storage_service: ObjectStorageService,
  ) {}

  async execute(now = new Date()): Promise<VideoCleanupStats> {
    const stats: VideoCleanupStats = {
      sessions_expired: 0,
      videos_published_original: 0,
      videos_requeued: 0,
      videos_failed: 0,
      errors: 0,
    };

    await this.expireSessions(now, stats);
    await this.recoverStuckVideos(now, stats);

    this.logger.log(`Limpieza de vídeos completada: ${JSON.stringify(stats)}`);
    return stats;
  }

  private async expireSessions(
    now: Date,
    stats: VideoCleanupStats,
  ): Promise<void> {
    const sessions = await this.sessions_repository.find({
      where: {
        status: In([
          VIDEO_UPLOAD_SESSION_STATUS.INITIATED,
          VIDEO_UPLOAD_SESSION_STATUS.UPLOADED,
        ]),
        expires_at: LessThan(now),
      },
      take: BATCH_SIZE,
    });

    const expired_ids: string[] = [];
    for (const session of sessions) {
      try {
        await (session.status === VIDEO_UPLOAD_SESSION_STATUS.INITIATED
          ? this.storage.abortMultipartUpload(
            session.storage_key,
            session.multipart_upload_id,
          )
          : this.storage.deleteObject(session.storage_key));
        expired_ids.push(session.id);
      } catch (error) {
        stats.errors++;
        this.logger.warn(
          `No se pudo limpiar la subida de vídeo ${session.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    if (expired_ids.length > 0) {
      await this.sessions_repository.update(
        { id: In(expired_ids) },
        { status: VIDEO_UPLOAD_SESSION_STATUS.EXPIRED },
      );
      stats.sessions_expired = expired_ids.length;
    }
  }

  private async recoverStuckVideos(
    now: Date,
    stats: VideoCleanupStats,
  ): Promise<void> {
    const stuck = await this.videos_repository.find({
      where: {
        status: In([
          VEHICLE_VIDEO_STATUS.UPLOADED,
          VEHICLE_VIDEO_STATUS.PROCESSING,
        ]),
        // Sin procesamiento no hay que esperar: se publican ya con el original
        updated_at: LessThan(
          envs.VIDEO_PROCESSING_ENABLED
            ? new Date(now.getTime() - STUCK_VIDEO_MS)
            : now,
        ),
      },
      take: BATCH_SIZE,
    });

    for (const video of stuck) {
      try {
        const is_temp_source = video.source_key?.includes("/temp/") ?? true;

        // Procesamiento apagado: los que quedaron en cola se publican con el original
        if (!envs.VIDEO_PROCESSING_ENABLED && video.source_key && !is_temp_source) {
          await this.videos_repository.update(video.id, {
            status: VEHICLE_VIDEO_STATUS.READY,
            url: this.object_storage_service.buildPublicUrl(video.source_key),
            failure_reason: null,
          });
          stats.videos_published_original++;
          continue;
        }
        const too_old =
          now.getTime() - video.created_at.getTime() > GIVE_UP_VIDEO_MS;
        if (!video.source_key || is_temp_source || too_old) {
          await this.videos_repository.update(video.id, {
            status: VEHICLE_VIDEO_STATUS.FAILED,
            failure_reason:
              video.failure_reason ?? "El procesamiento del vídeo no terminó",
          });
          stats.videos_failed++;
          continue;
        }

        // Si el job sigue vivo en la cola, no se duplica (jobId = video.id)
        const existing = await this.video_queue.getJob(video.id);
        const state = existing ? await existing.getState() : null;
        if (state === "active" || state === "waiting" || state === "delayed") {
          continue;
        }
        if (existing) {
          await existing.remove();
        }

        await this.video_queue.add(
          `process-vehicle-video-${video.id}`,
          {
            video_id: video.id,
            vehicle_id: video.vehicle_id,
            source_key: video.source_key,
          },
          {
            jobId: video.id,
            attempts: 3,
            backoff: { type: "exponential", delay: 30_000 },
            removeOnComplete: 100,
            removeOnFail: 100,
          },
        );
        // Evita reencolar en la siguiente pasada mientras espera
        await this.videos_repository.update(video.id, {
          status: VEHICLE_VIDEO_STATUS.UPLOADED,
        });
        stats.videos_requeued++;
      } catch (error) {
        stats.errors++;
        this.logger.warn(
          `No se pudo recuperar el vídeo ${video.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }
}
