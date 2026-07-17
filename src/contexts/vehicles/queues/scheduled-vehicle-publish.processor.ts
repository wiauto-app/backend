import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Job } from "bullmq";

import { VehicleService } from "../services/vehicle.service";
import {
  SCHEDULED_VEHICLE_PUBLISH_JOB_TICK,
  SCHEDULED_VEHICLE_PUBLISH_QUEUE,
} from "./scheduled-vehicle-publish.queue.constants";

@Processor(SCHEDULED_VEHICLE_PUBLISH_QUEUE)
@Injectable()
export class ScheduledVehiclePublishProcessor extends WorkerHost {
  constructor(
    private readonly vehicle_service: VehicleService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === SCHEDULED_VEHICLE_PUBLISH_JOB_TICK) {
      await this.vehicle_service.processScheduledPublish();
      return;
    }

    throw new Error(
      `Trabajo de publicación programada desconocido: ${job.name}`,
    );
  }
}
