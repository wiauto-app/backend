import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { Queue } from "bullmq";

import {
  PROACTIVE_ALERTS_JOB_DAILY,
  PROACTIVE_ALERTS_JOB_WEEKLY,
  PROACTIVE_ALERTS_QUEUE,
} from "./proactive-alerts.queue.constants";

@Injectable()
export class ProactiveAlertsBootstrapService implements OnModuleInit {
  constructor(
    @InjectQueue(PROACTIVE_ALERTS_QUEUE)
    private readonly queue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.queue.add(
      PROACTIVE_ALERTS_JOB_DAILY,
      {},
      {
        repeat: { pattern: "0 9 * * *" },
        jobId: PROACTIVE_ALERTS_JOB_DAILY,
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );

    await this.queue.add(
      PROACTIVE_ALERTS_JOB_WEEKLY,
      {},
      {
        repeat: { pattern: "0 9 * * 1" },
        jobId: PROACTIVE_ALERTS_JOB_WEEKLY,
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
  }
}
