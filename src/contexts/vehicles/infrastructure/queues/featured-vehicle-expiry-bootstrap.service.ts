import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { Queue } from "bullmq";

import {
  FEATURED_VEHICLE_EXPIRY_JOB_TICK,
  FEATURED_VEHICLE_EXPIRY_QUEUE,
} from "./featured-vehicle-expiry.queue.constants";

@Injectable()
export class FeaturedVehicleExpiryBootstrapService implements OnModuleInit {
  constructor(
    @InjectQueue(FEATURED_VEHICLE_EXPIRY_QUEUE)
    private readonly queue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.queue.add(
      FEATURED_VEHICLE_EXPIRY_JOB_TICK,
      {},
      {
        repeat: { every: 60_000 },
        jobId: FEATURED_VEHICLE_EXPIRY_JOB_TICK,
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
  }
}
