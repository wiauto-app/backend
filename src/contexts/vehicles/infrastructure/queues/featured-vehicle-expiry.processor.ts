import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Job } from "bullmq";

import { ExpireFeaturedVehiclesUseCase } from "../../application/vehicle/expire-featured-vehicles-use-case/expire-featured-vehicles.use-case";
import {
  FEATURED_VEHICLE_EXPIRY_JOB_TICK,
  FEATURED_VEHICLE_EXPIRY_QUEUE,
} from "./featured-vehicle-expiry.queue.constants";

@Processor(FEATURED_VEHICLE_EXPIRY_QUEUE)
@Injectable()
export class FeaturedVehicleExpiryProcessor extends WorkerHost {
  constructor(
    private readonly expire_featured_vehicles_use_case: ExpireFeaturedVehiclesUseCase,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === FEATURED_VEHICLE_EXPIRY_JOB_TICK) {
      await this.expire_featured_vehicles_use_case.execute();
      return;
    }

    throw new Error(
      `Trabajo de expiración de destacados desconocido: ${job.name}`,
    );
  }
}
