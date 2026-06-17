import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { Queue } from "bullmq";

import {
  ALERT_DIGEST_JOB_DAILY,
  ALERT_DIGEST_JOB_REMINDERS,
  ALERT_DIGEST_JOB_WEEKLY,
  ALERT_DIGEST_QUEUE,
} from "./alert-processing.queue.constants";

@Injectable()
export class AlertDigestBootstrapService implements OnModuleInit {
  constructor(
    @InjectQueue(ALERT_DIGEST_QUEUE)
    private readonly queue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.queue.add(
      ALERT_DIGEST_JOB_DAILY,
      {},
      {
        repeat: { pattern: "0 8 * * *" },
        jobId: ALERT_DIGEST_JOB_DAILY,
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );

    await this.queue.add(
      ALERT_DIGEST_JOB_WEEKLY,
      {},
      {
        repeat: { pattern: "0 8 * * 1" },
        jobId: ALERT_DIGEST_JOB_WEEKLY,
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );

    await this.queue.add(
      ALERT_DIGEST_JOB_REMINDERS,
      {},
      {
        repeat: { pattern: "0 9 * * *" },
        jobId: ALERT_DIGEST_JOB_REMINDERS,
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
  }
}
