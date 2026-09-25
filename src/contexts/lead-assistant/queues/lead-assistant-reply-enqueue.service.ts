import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { Queue } from "bullmq";

import {
  LEAD_ASSISTANT_REPLY_CHANNEL,
  LEAD_ASSISTANT_REPLY_JOB,
  LEAD_ASSISTANT_REPLY_QUEUE,
  type LeadAssistantReplyJobData,
  leadAssistantEmailReplyJobId,
  leadAssistantReplyJobId,
} from "./lead-assistant-reply.queue.constants";

@Injectable()
export class LeadAssistantReplyEnqueueService {
  constructor(
    @InjectQueue(LEAD_ASSISTANT_REPLY_QUEUE)
    private readonly queue: Queue<LeadAssistantReplyJobData>,
  ) {}

  async enqueue(
    data: LeadAssistantReplyJobData,
    delay_ms: number,
  ): Promise<void> {
    if (!data.chat_id || !data.trigger_message_id) {
      return;
    }
    await this.queue.add(LEAD_ASSISTANT_REPLY_JOB, data, {
      jobId: leadAssistantReplyJobId(data.chat_id, data.trigger_message_id),
      delay: Math.max(0, delay_ms),
      removeOnComplete: true,
      removeOnFail: 50,
    });
  }

  async enqueueEmail(
    data: LeadAssistantReplyJobData,
    delay_ms: number,
  ): Promise<void> {
    await this.queue.add(LEAD_ASSISTANT_REPLY_JOB, data, {
      jobId: leadAssistantEmailReplyJobId(data.lead_id),
      delay: Math.max(0, delay_ms),
      removeOnComplete: true,
      removeOnFail: 50,
    });
  }
}
