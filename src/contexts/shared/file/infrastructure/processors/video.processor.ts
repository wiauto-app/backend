import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { file_key_to_mp4_storage_key } from "../utils/file-key-to-mp4-storage-key.util";
import { Logger } from "@nestjs/common";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";

import { FileStoragePort, CONTENT_TYPES } from "../../domain/ports/file-storage.port";
import { VideoProcessorPort } from "../../domain/ports/video-processor.port";
import { local_processed_video_path } from "../adapters/ffmpeg.adapter";
import { UPLOAD_VIDEO_QUEUE } from "../media.constants";
import { ConfirmVideoUploadDto } from "../../application/videos-use-cases/confirm-video-upload-use-case/confirm-video-upload.dto";

@Processor(UPLOAD_VIDEO_QUEUE)
export class VideoProcessor extends WorkerHost {
  private readonly logger = new Logger(VideoProcessor.name);

  constructor(
    private readonly videoProcessorPort: VideoProcessorPort,
    private readonly fileStoragePort: FileStoragePort,
  ) {
    super();
  }

  async process(job: Job<ConfirmVideoUploadDto>): Promise<void> {
    const { file_key } = job.data;
    const buffer = await this.fileStoragePort.downloadVideoFile(file_key);
    if (!buffer) {
      throw new Error("File not found");
    }

    const ext = path.extname(file_key) || ".mp4";
    const file_name = `${randomUUID()}${ext}`;
    const input_path = path.join(os.tmpdir(), file_name);
    const output_path = local_processed_video_path(input_path);

    try {
      await fs.writeFile(input_path, buffer);
      await this.videoProcessorPort.processVideo(input_path);
      const processed = await fs.readFile(output_path);
      const content_type = CONTENT_TYPES.VIDEO_MP4;
      const file_key_final = file_key_to_mp4_storage_key(file_key);

      await this.fileStoragePort.replaceVideoObject(
        file_key_final,
        processed,
        content_type,
      );
      if (file_key_final !== file_key) {
        await this.fileStoragePort.deleteVideoObject(file_key);
      }
      this.logger.log(
        `Video optimizado en MinIO: ${file_key} -> ${file_key_final}`,
      );
    } catch (error) {
      this.logger.error(
        `Error procesando vídeo ${file_key}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    } finally {
      await Promise.all([
        this.safe_unlink(input_path),
        this.safe_unlink(output_path),
      ]);
    }
  }

  private async safe_unlink(file_path: string): Promise<void> {
    try {
      await fs.unlink(file_path);
    } catch {
      /* ya borrado o no existía */
    }
  }
}
