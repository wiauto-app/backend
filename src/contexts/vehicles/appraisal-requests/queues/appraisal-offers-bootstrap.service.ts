import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { Queue } from "bullmq";

import {
  APPRAISAL_OFFERS_JOB_EXPIRE,
  APPRAISAL_OFFERS_QUEUE,
} from "./appraisal-offers.queue.constants";

/** Programa el job diario que cierra las tasaciones vencidas. */
@Injectable()
export class AppraisalOffersBootstrapService implements OnModuleInit {
  constructor(
    @InjectQueue(APPRAISAL_OFFERS_QUEUE)
    private readonly queue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.queue.add(
      APPRAISAL_OFFERS_JOB_EXPIRE,
      {},
      {
        repeat: { pattern: "0 * * * *" },
        jobId: APPRAISAL_OFFERS_JOB_EXPIRE,
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
  }
}
