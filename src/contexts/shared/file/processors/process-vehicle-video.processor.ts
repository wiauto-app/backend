import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Job } from "bullmq";
import { Repository } from "typeorm";

import {
  VEHICLE_VIDEO_STATUS,
  VideosEntity,
} from "@/src/contexts/vehicles/entities/videos.entity";
import { VehicleDetailCacheService } from "@/src/contexts/vehicles/services/vehicle-detail-cache.service";
import {
  type ProcessVehicleVideoJob,
  vehicleVideoOutputKeys,
} from "@/src/contexts/vehicles/vehicle-videos/services/vehicle-video-attach.service";
import { ObjectStorageService } from "../../object-storage/object-storage.service";
import { MultipartObjectStorageService } from "../../object-storage/multipart-object-storage.service";
import { PROCESS_VEHICLE_VIDEO_QUEUE } from "../media.constants";
import { buildThumbnailArgs, buildTranscodeArgs } from "../video/ffmpeg-args";
import { probeVideo } from "../video/ffprobe";
import { getFfmpegCapabilities } from "../video/ffmpeg-capabilities";
import { runProcess } from "../video/run-process";

const TRANSCODE_TIMEOUT_MS = 10 * 60 * 1000;
const THUMBNAIL_TIMEOUT_MS = 60 * 1000;

/**
 * Transcodifica vídeos de vehículos (MP4 H.264/AAC faststart + miniatura WebP).
 * Solo se registra en procesos con `APP_ROLE` worker/all: FFmpeg nunca compite
 * por CPU con la API. Idempotente: las keys de salida son deterministas y un
 * reintento sobrescribe.
 */
@Processor(PROCESS_VEHICLE_VIDEO_QUEUE, {
  concurrency: 1,
  // Un transcode largo no debe considerarse "stalled"
  lockDuration: TRANSCODE_TIMEOUT_MS + 60_000,
})
export class ProcessVehicleVideoProcessor extends WorkerHost {
  private readonly logger = new Logger(ProcessVehicleVideoProcessor.name);

  constructor(
    @InjectRepository(VideosEntity)
    private readonly videos_repository: Repository<VideosEntity>,
    private readonly storage: MultipartObjectStorageService,
    private readonly object_storage_service: ObjectStorageService,
    private readonly vehicle_detail_cache: VehicleDetailCacheService,
  ) {
    super();
  }

  async process(job: Job<ProcessVehicleVideoJob>): Promise<void> {
    const { video_id, vehicle_id, source_key } = job.data;

    const video = await this.videos_repository.findOne({
      where: { id: video_id },
    });
    if (!video) {
      // Vehículo o vídeo borrado mientras esperaba en cola
      this.logger.warn(`Vídeo ${video_id} ya no existe; se descarta el job`);
      return;
    }
    if (video.status === VEHICLE_VIDEO_STATUS.READY) {
      return;
    }

    const work_dir = await mkdtemp(path.join(tmpdir(), `wiauto-video-${video_id}-`));
    const input = path.join(work_dir, "source");
    const optimized = path.join(work_dir, "optimized.mp4");

    try {
      await this.videos_repository.update(video_id, {
        status: VEHICLE_VIDEO_STATUS.PROCESSING,
        failure_reason: null,
      });

      const capabilities = await getFfmpegCapabilities();
      const thumbnail_format = capabilities.has_libwebp ? "webp" : "jpeg";
      const thumbnail = path.join(
        work_dir,
        thumbnail_format === "webp" ? "thumbnail.webp" : "thumbnail.jpg",
      );
      if (!capabilities.has_zscale) {
        this.logger.warn(
          "ffmpeg sin zscale: los vídeos HDR se convierten sin tone mapping",
        );
      }

      await this.storage.downloadToFile(source_key, input);
      const probe = await probeVideo(input);
      if (!probe.has_video) {
        throw new Error("El archivo no contiene una pista de vídeo");
      }

      this.logger.log(
        `Transcodificando vídeo ${video_id} (${probe.video_codec ?? "?"}, ${probe.width}x${probe.height}, HDR=${probe.is_hdr})`,
      );
      await runProcess(
        "ffmpeg",
        buildTranscodeArgs({
          input,
          output: optimized,
          is_hdr: probe.is_hdr,
          can_tonemap: capabilities.has_zscale,
        }),
        TRANSCODE_TIMEOUT_MS,
      );
      await runProcess(
        "ffmpeg",
        buildThumbnailArgs({
          input,
          output: thumbnail,
          duration_s: probe.duration_s,
          is_hdr: probe.is_hdr,
          can_tonemap: capabilities.has_zscale,
          format: thumbnail_format,
        }),
        THUMBNAIL_TIMEOUT_MS,
      );

      const output = await probeVideo(optimized);
      const keys = vehicleVideoOutputKeys(vehicle_id, video_id);
      await this.storage.uploadFromFile(keys.optimized, optimized, "video/mp4");
      const thumbnail_key =
        thumbnail_format === "webp" ? keys.thumbnail_webp : keys.thumbnail_jpeg;
      await this.storage.uploadFromFile(
        thumbnail_key,
        thumbnail,
        thumbnail_format === "webp" ? "image/webp" : "image/jpeg",
      );

      await this.videos_repository.update(video_id, {
        status: VEHICLE_VIDEO_STATUS.READY,
        url: this.object_storage_service.buildPublicUrl(keys.optimized),
        thumbnail_url: this.object_storage_service.buildPublicUrl(thumbnail_key),
        duration_s: output.duration_s ?? probe.duration_s,
        width: output.width,
        height: output.height,
        failure_reason: null,
      });
      await this.invalidateVehicleDetail(vehicle_id);
      this.logger.log(`Vídeo ${video_id} procesado`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      const attempts = job.opts.attempts ?? 1;
      const is_last_attempt = job.attemptsMade + 1 >= attempts;
      this.logger.error(
        `Error procesando vídeo ${video_id} (intento ${job.attemptsMade + 1}/${attempts}): ${reason}`,
      );
      await this.videos_repository.update(video_id, {
        // Mientras queden reintentos sigue "procesando" para el cliente
        status: is_last_attempt
          ? VEHICLE_VIDEO_STATUS.FAILED
          : VEHICLE_VIDEO_STATUS.PROCESSING,
        failure_reason: reason.slice(0, 1000),
      });
      if (is_last_attempt) {
        await this.invalidateVehicleDetail(vehicle_id);
      }
      throw error;
    } finally {
      await rm(work_dir, { recursive: true, force: true });
    }
  }

  private async invalidateVehicleDetail(vehicle_id: string): Promise<void> {
    try {
      await this.vehicle_detail_cache.invalidate(vehicle_id);
    } catch (error) {
      this.logger.warn(
        `No se pudo invalidar la caché del vehículo ${vehicle_id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
