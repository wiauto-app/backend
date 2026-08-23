import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { Queue } from "bullmq";

import {
  TEMP_UPLOAD_CLEANUP_JOB_TICK,
  TEMP_UPLOAD_CLEANUP_QUEUE,
} from "./temp-upload-cleanup.queue.constants";

@Injectable()
export class TempUploadCleanupBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(TempUploadCleanupBootstrapService.name);

  constructor(
    @InjectQueue(TEMP_UPLOAD_CLEANUP_QUEUE)
    private readonly queue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    // Configurar job recurrente cada hora (0 * * * * = minuto 0 de cada hora)
    await this.queue.add(
      TEMP_UPLOAD_CLEANUP_JOB_TICK,
      {},
      {
        repeat: { pattern: "0 * * * *" },
        jobId: TEMP_UPLOAD_CLEANUP_JOB_TICK,
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );

    this.logger.log(
      "Job recurrente de limpieza de temporary_uploads configurado (cada hora)",
    );
  }
}
