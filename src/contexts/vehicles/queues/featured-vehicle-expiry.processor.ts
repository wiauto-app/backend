import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Job } from "bullmq";

import { VehicleService } from "../services/vehicle.service";
import {
  FEATURED_VEHICLE_EXPIRY_JOB_TICK,
  FEATURED_VEHICLE_EXPIRY_QUEUE,
} from "./featured-vehicle-expiry.queue.constants";

@Processor(FEATURED_VEHICLE_EXPIRY_QUEUE)
@Injectable()
export class FeaturedVehicleExpiryProcessor extends WorkerHost {
  constructor(
    private readonly vehicle_service: VehicleService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === FEATURED_VEHICLE_EXPIRY_JOB_TICK) {
      await this.vehicle_service.expireFeatured();
      return;
    }

    throw new Error(
      `Trabajo de expiración de destacados desconocido: ${job.name}`,
    );
  }
}
