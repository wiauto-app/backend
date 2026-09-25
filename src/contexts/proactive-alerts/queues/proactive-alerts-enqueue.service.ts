import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { Queue } from "bullmq";

import {
  PROACTIVE_ALERTS_JOB_HOT_LEAD,
  PROACTIVE_ALERTS_JOB_VEHICLE_PUBLISHED,
  PROACTIVE_ALERTS_QUEUE,
  type ProactiveAlertsHotLeadJobData,
  type ProactiveAlertsVehiclePublishedJobData,
} from "./proactive-alerts.queue.constants";

@Injectable()
export class ProactiveAlertEnqueueService {
  constructor(
    @InjectQueue(PROACTIVE_ALERTS_QUEUE)
    private readonly queue: Queue,
  ) {}

  async enqueueHotLeadCheck(
    data: ProactiveAlertsHotLeadJobData,
    delay_ms: number,
  ): Promise<void> {
    await this.queue.add(PROACTIVE_ALERTS_JOB_HOT_LEAD, data, {
      jobId: `proactive-hot-lead-${data.lead_id}`,
      delay: Math.max(0, delay_ms),
      removeOnComplete: true,
      removeOnFail: 50,
    });
  }

  async enqueueVehiclePublished(
    data: ProactiveAlertsVehiclePublishedJobData,
  ): Promise<void> {
    await this.queue.add(PROACTIVE_ALERTS_JOB_VEHICLE_PUBLISHED, data, {
      jobId: `proactive-cheaper-competitor-${data.vehicle_id}-${Date.now()}`,
      removeOnComplete: true,
      removeOnFail: 50,
    });
  }
}
