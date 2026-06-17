import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Job } from "bullmq";

import { ProcessAlertEventUseCase } from "../../application/process-alert-event-use-case/process-alert-event.use-case";
import { ALERT_EVENT_TYPE } from "../../domain/enums/alert-event-type.enum";
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
    private readonly process_alert_event_use_case: ProcessAlertEventUseCase,
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
      await this.process_alert_event_use_case.execute({
        vehicle_id: data.vehicle_id,
        event_type: ALERT_EVENT_TYPE.NEW_LISTING,
      });
      return;
    }

    if (job.name === ALERT_PROCESSING_JOB_VEHICLE_EVENT) {
      const data = job.data as AlertProcessingVehicleEventJobData;
      await this.process_alert_event_use_case.execute({
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
