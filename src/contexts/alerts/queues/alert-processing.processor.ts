import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Job } from "bullmq";

import { AlertNotificationService } from "../services/alert-notification.service";
import { ALERT_EVENT_TYPE } from "../types/alert-event-type.enum";
import {
  ALERT_PROCESSING_JOB_VEHICLE_EVENT,
  ALERT_PROCESSING_JOB_VEHICLE_PUBLISHED,
  ALERT_PROCESSING_QUEUE,
  AlertProcessingVehicleEventJobData,
  AlertProcessingVehiclePublishedJobData,
} from "./alert-processing.queue.constants";

@Processor(ALERT_PROCESSING_QUEUE)
@Injectable()
export class AlertProcessingProcessor extends WorkerHost {
  constructor(
    private readonly alert_notification_service: AlertNotificationService,
  ) {
    super();
  }

  async process(
    job: Job<
      AlertProcessingVehiclePublishedJobData | AlertProcessingVehicleEventJobData
    >,
  ): Promise<void> {
    if (job.name === ALERT_PROCESSING_JOB_VEHICLE_PUBLISHED) {
      const data = job.data as AlertProcessingVehiclePublishedJobData;
      await this.alert_notification_service.processEvent({
        vehicle_id: data.vehicle_id,
        event_type: ALERT_EVENT_TYPE.NEW_LISTING,
      });
      return;
    }

    if (job.name === ALERT_PROCESSING_JOB_VEHICLE_EVENT) {
      const data = job.data as AlertProcessingVehicleEventJobData;
      await this.alert_notification_service.processEvent({
        vehicle_id: data.vehicle_id,
        event_type: data.event_type as (typeof ALERT_EVENT_TYPE)[keyof typeof ALERT_EVENT_TYPE],
        profile_id: data.profile_id,
        metadata: data.metadata,
      });
      return;
    }

    throw new Error(`Trabajo de procesamiento de alertas desconocido: ${job.name}`);
  }
}
