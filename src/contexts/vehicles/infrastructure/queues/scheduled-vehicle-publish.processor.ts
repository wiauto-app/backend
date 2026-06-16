import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Job } from "bullmq";

import { ProcessScheduledVehiclePublishUseCase } from "../../application/vehicle/process-scheduled-vehicle-publish-use-case/process-scheduled-vehicle-publish.use-case";
import {
  SCHEDULED_VEHICLE_PUBLISH_JOB_TICK,
  SCHEDULED_VEHICLE_PUBLISH_QUEUE,
} from "./scheduled-vehicle-publish.queue.constants";

@Processor(SCHEDULED_VEHICLE_PUBLISH_QUEUE)
@Injectable()
export class ScheduledVehiclePublishProcessor extends WorkerHost {
  constructor(
    private readonly process_scheduled_vehicle_publish_use_case: ProcessScheduledVehiclePublishUseCase,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === SCHEDULED_VEHICLE_PUBLISH_JOB_TICK) {
      await this.process_scheduled_vehicle_publish_use_case.execute();
      return;
    }

    throw new Error(
      `Trabajo de publicación programada desconocido: ${job.name}`,
    );
  }
}
