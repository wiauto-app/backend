import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";

import {
  TEMP_UPLOAD_CLEANUP_JOB_TICK,
  TEMP_UPLOAD_CLEANUP_QUEUE,
} from "./temp-upload-cleanup.queue.constants";
import { CleanupAbandonedTempUploadsService } from "../services/cleanup-abandoned-temp-uploads.service";

@Processor(TEMP_UPLOAD_CLEANUP_QUEUE)
export class TempUploadCleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(TempUploadCleanupProcessor.name);

  constructor(
    private readonly cleanupService: CleanupAbandonedTempUploadsService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === TEMP_UPLOAD_CLEANUP_JOB_TICK) {
      this.logger.debug("Ejecutando job de limpieza de temporary_uploads");

      try {
        const stats = await this.cleanupService.execute();
        this.logger.log(
          `Job de limpieza completado. Candidatos: ${stats.candidatesFound}, Archivos eliminados: ${stats.filesDeleted}, Filas eliminadas: ${stats.rowsDeleted}, Errores R2: ${stats.r2Errors}`,
        );
      } catch (error) {
        this.logger.error(
          `Error en job de limpieza: ${(error as Error).message}`,
          (error as Error).stack,
        );
        throw error;
      }
    }
  }
}
