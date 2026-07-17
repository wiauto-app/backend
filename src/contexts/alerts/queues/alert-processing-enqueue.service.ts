import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";

import type { AlertEventType } from "../types/alert-event-type.enum";
import {
  ALERT_DIGEST_JOB_DAILY,
  ALERT_DIGEST_JOB_REMINDERS,
  ALERT_DIGEST_JOB_WEEKLY,
  ALERT_DIGEST_QUEUE,
  ALERT_PROCESSING_JOB_VEHICLE_EVENT,
  ALERT_PROCESSING_JOB_VEHICLE_PUBLISHED,
  ALERT_PROCESSING_QUEUE,
  AlertProcessingVehicleEventJobData,
  AlertProcessingVehiclePublishedJobData,
} from "./alert-processing.queue.constants";

@Injectable()
export class AlertProcessingEnqueueService {
  constructor(
    @InjectQueue(ALERT_PROCESSING_QUEUE)
    private readonly alert_processing_queue: Queue,
  ) {}

  async enqueue_vehicle_published(
    data: AlertProcessingVehiclePublishedJobData,
  ): Promise<void> {
    await this.alert_processing_queue.add(
      ALERT_PROCESSING_JOB_VEHICLE_PUBLISHED,
      data,
    );
  }

  async enqueue_vehicle_event(data: {
    vehicle_id?: string;
    event_type: AlertEventType;
    profile_id?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const payload: AlertProcessingVehicleEventJobData = {
      vehicle_id: data.vehicle_id,
      event_type: data.event_type,
      profile_id: data.profile_id,
      metadata: data.metadata,
    };

    await this.alert_processing_queue.add(
      ALERT_PROCESSING_JOB_VEHICLE_EVENT,
      payload,
    );
  }
}

@Injectable()
export class AlertDigestEnqueueService {
  constructor(
    @InjectQueue(ALERT_DIGEST_QUEUE)
    private readonly alert_digest_queue: Queue,
  ) {}

  async schedule_recurring_jobs(): Promise<void> {
    await this.alert_digest_queue.add(
      ALERT_DIGEST_JOB_DAILY,
      {},
      {
        repeat: { pattern: "0 8 * * *" },
        jobId: ALERT_DIGEST_JOB_DAILY,
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );

    await this.alert_digest_queue.add(
      ALERT_DIGEST_JOB_WEEKLY,
      {},
      {
        repeat: { pattern: "0 8 * * 1" },
        jobId: ALERT_DIGEST_JOB_WEEKLY,
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );

    await this.alert_digest_queue.add(
      ALERT_DIGEST_JOB_REMINDERS,
      {},
      {
        repeat: { pattern: "0 9 * * *" },
        jobId: ALERT_DIGEST_JOB_REMINDERS,
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
  }
}
