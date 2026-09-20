import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";

import {
  PUSH_EXPO_RECEIPTS_DELAY_MS,
  PUSH_JOB_EXPO_RECEIPTS,
  PUSH_MAINTENANCE_QUEUE,
  type PushExpoReceiptsJobData,
} from "./push-maintenance.queue.constants";

@Injectable()
export class PushMaintenanceEnqueueService {
  constructor(
    @InjectQueue(PUSH_MAINTENANCE_QUEUE)
    private readonly push_maintenance_queue: Queue,
  ) {}

  async schedule_expo_receipts(
    items: PushExpoReceiptsJobData["items"],
  ): Promise<void> {
    if (items.length === 0) {
      return;
    }

    const payload: PushExpoReceiptsJobData = { items };
    await this.push_maintenance_queue.add(PUSH_JOB_EXPO_RECEIPTS, payload, {
      delay: PUSH_EXPO_RECEIPTS_DELAY_MS,
      attempts: 3,
      backoff: { type: "exponential", delay: 60_000 },
      removeOnComplete: true,
      removeOnFail: 100,
    });
  }
}
