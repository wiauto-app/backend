import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { Queue } from "bullmq";

import {
  SCHEDULED_VEHICLE_PUBLISH_JOB_TICK,
  SCHEDULED_VEHICLE_PUBLISH_QUEUE,
} from "./scheduled-vehicle-publish.queue.constants";

@Injectable()
export class ScheduledVehiclePublishBootstrapService implements OnModuleInit {
  constructor(
    @InjectQueue(SCHEDULED_VEHICLE_PUBLISH_QUEUE)
    private readonly queue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.queue.add(
      SCHEDULED_VEHICLE_PUBLISH_JOB_TICK,
      {},
      {
        repeat: { every: 60_000 },
        jobId: SCHEDULED_VEHICLE_PUBLISH_JOB_TICK,
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
  }
}
