import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Queue } from "bullmq";

import { EXPIRY_WARNING_MS } from "../utils/owner-vehicle-rules";
import {
  VEHICLE_LISTING_EXPIRY_JOB_EXPIRE,
  VEHICLE_LISTING_EXPIRY_JOB_WARN,
  VEHICLE_LISTING_EXPIRY_QUEUE,
  vehicleListingExpiryExpireJobId,
  vehicleListingExpiryWarnJobId,
  type VehicleListingExpiryJobData,
} from "./vehicle-listing-expiry.queue.constants";

@Injectable()
export class VehicleListingExpiryScheduler {
  private readonly logger = new Logger(VehicleListingExpiryScheduler.name);

  constructor(
    @InjectQueue(VEHICLE_LISTING_EXPIRY_QUEUE)
    private readonly queue: Queue<VehicleListingExpiryJobData>,
  ) {}

  async scheduleForVehicle(
    vehicle_id: string,
    expires_at: Date,
    now: Date = new Date(),
  ): Promise<void> {
    await this.cancelForVehicle(vehicle_id);

    const expire_delay = expires_at.getTime() - now.getTime();
    if (expire_delay <= 0) {
      await this.queue.add(
        VEHICLE_LISTING_EXPIRY_JOB_EXPIRE,
        { vehicle_id },
        {
          jobId: vehicleListingExpiryExpireJobId(vehicle_id),
          delay: 0,
          removeOnComplete: true,
          removeOnFail: 50,
        },
      );
      return;
    }

    const warn_at = expires_at.getTime() - EXPIRY_WARNING_MS;
    const warn_delay = warn_at - now.getTime();
    if (warn_delay > 0) {
      await this.queue.add(
        VEHICLE_LISTING_EXPIRY_JOB_WARN,
        { vehicle_id },
        {
          jobId: vehicleListingExpiryWarnJobId(vehicle_id),
          delay: warn_delay,
          removeOnComplete: true,
          removeOnFail: 50,
        },
      );
    }

    await this.queue.add(
      VEHICLE_LISTING_EXPIRY_JOB_EXPIRE,
      { vehicle_id },
      {
        jobId: vehicleListingExpiryExpireJobId(vehicle_id),
        delay: expire_delay,
        removeOnComplete: true,
        removeOnFail: 50,
      },
    );
  }

  async cancelForVehicle(vehicle_id: string): Promise<void> {
    const job_ids = [
      vehicleListingExpiryWarnJobId(vehicle_id),
      vehicleListingExpiryExpireJobId(vehicle_id),
    ];

    for (const job_id of job_ids) {
      try {
        const job = await this.queue.getJob(job_id);
        if (job) {
          await job.remove();
        }
      } catch (error) {
        this.logger.warn(
          `No se pudo cancelar job de caducidad ${job_id}: ${(error as Error).message}`,
        );
      }
    }
  }
}
