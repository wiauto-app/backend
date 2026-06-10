import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Job } from "bullmq";

import { MatchVehicleAlertsUseCase } from "../../application/match-vehicle-alerts-use-case/match-vehicle-alerts.use-case";
import {
  ALERT_PROCESSING_JOB_VEHICLE_PUBLISHED,
  ALERT_PROCESSING_QUEUE,
  AlertProcessingVehiclePublishedJobData,
} from "./alert-processing.queue.constants";

@Processor(ALERT_PROCESSING_QUEUE)
@Injectable()
export class AlertProcessingProcessor extends WorkerHost {
  constructor(
    private readonly match_vehicle_alerts_use_case: MatchVehicleAlertsUseCase,
  ) {
    super();
  }

  async process(
    job: Job<AlertProcessingVehiclePublishedJobData>,
  ): Promise<void> {
    if (job.name === ALERT_PROCESSING_JOB_VEHICLE_PUBLISHED) {
      await this.match_vehicle_alerts_use_case.execute({
        vehicle_id: job.data.vehicle_id,
      });
      return;
    }

    throw new Error(`Trabajo de procesamiento de alertas desconocido: ${job.name}`);
  }
}
