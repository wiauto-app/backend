import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Job } from "bullmq";

import { LeadAssistantReplyJobService } from "../services/lead-assistant-reply-job.service";
import {
  LEAD_ASSISTANT_REPLY_JOB,
  LEAD_ASSISTANT_REPLY_QUEUE,
  type LeadAssistantReplyJobData,
} from "./lead-assistant-reply.queue.constants";

@Processor(LEAD_ASSISTANT_REPLY_QUEUE)
@Injectable()
export class LeadAssistantReplyProcessor extends WorkerHost {
  private readonly logger = new Logger(LeadAssistantReplyProcessor.name);

  constructor(
    private readonly lead_assistant_reply_job_service: LeadAssistantReplyJobService,
  ) {
    super();
  }

  async process(job: Job<LeadAssistantReplyJobData>): Promise<void> {
    if (job.name !== LEAD_ASSISTANT_REPLY_JOB) {
      throw new Error(`Trabajo de asistente de leads desconocido: ${job.name}`);
    }
    try {
      await this.lead_assistant_reply_job_service.process(job.data);
    } catch (error) {
      this.logger.error(
        `Error procesando respuesta del asistente (${job.id})`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
