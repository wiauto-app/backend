import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Job, Queue } from "bullmq";

import { PlanAccessGrantsService } from "../services/plan-access-grants.service";
import {
  PLAN_ACCESS_GRANT_EXPIRY_CRON,
  PLAN_ACCESS_GRANT_EXPIRY_JOB,
  PLAN_ACCESS_GRANT_EXPIRY_QUEUE,
  PLAN_ACCESS_GRANT_EXPIRY_TZ,
} from "./plan-access-grant-expiry.queue.constants";

@Processor(PLAN_ACCESS_GRANT_EXPIRY_QUEUE)
@Injectable()
export class PlanAccessGrantExpiryProcessor extends WorkerHost {
  private readonly logger = new Logger(PlanAccessGrantExpiryProcessor.name);

  constructor(private readonly plan_access_grants_service: PlanAccessGrantsService) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name !== PLAN_ACCESS_GRANT_EXPIRY_JOB) {
      throw new Error(`Trabajo de vencimiento de grants desconocido: ${job.name}`);
    }
    const processed = await this.plan_access_grants_service.processExpiredGrants();
    this.logger.log(`plan_access_grants.expired processed=${processed}`);
  }
}

@Injectable()
export class PlanAccessGrantExpiryBootstrapService implements OnModuleInit {
  constructor(
    @InjectQueue(PLAN_ACCESS_GRANT_EXPIRY_QUEUE)
    private readonly queue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.queue.add(
      PLAN_ACCESS_GRANT_EXPIRY_JOB,
      {},
      {
        repeat: {
          pattern: PLAN_ACCESS_GRANT_EXPIRY_CRON,
          tz: PLAN_ACCESS_GRANT_EXPIRY_TZ,
        },
        jobId: PLAN_ACCESS_GRANT_EXPIRY_JOB,
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
  }
}
