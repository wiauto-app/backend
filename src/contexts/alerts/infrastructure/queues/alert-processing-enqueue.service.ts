import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";

import {
  ALERT_PROCESSING_JOB_VEHICLE_PUBLISHED,
  ALERT_PROCESSING_QUEUE,
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
}
