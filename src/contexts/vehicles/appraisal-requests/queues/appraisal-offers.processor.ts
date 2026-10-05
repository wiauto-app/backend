import { Processor, WorkerHost } from "@nestjs/bullmq";
import { InjectRepository } from "@nestjs/typeorm";
import { Job } from "bullmq";
import { Repository } from "typeorm";

import { AppraisalRequestEntity } from "../entities/appraisal-request.entity";
import { AppraisalExpirationService } from "../services/appraisal-expiration.service";
import { AppraisalNotificationService } from "../services/appraisal-notification.service";
import { APPRAISAL_VIEW_RELATIONS } from "../services/appraisal-view.mapper";
import { APPRAISAL_REQUEST_STATUS } from "../types/appraisal-request";
import {
  APPRAISAL_OFFERS_JOB_EXPIRE,
  APPRAISAL_OFFERS_JOB_NOTIFY_OPPORTUNITY,
  APPRAISAL_OFFERS_QUEUE,
  type AppraisalNotifyOpportunityJobData,
} from "./appraisal-offers.queue.constants";

@Processor(APPRAISAL_OFFERS_QUEUE)
export class AppraisalOffersProcessor extends WorkerHost {
  constructor(
    @InjectRepository(AppraisalRequestEntity)
    private readonly appraisal_repository: Repository<AppraisalRequestEntity>,
    private readonly notification_service: AppraisalNotificationService,
    private readonly expiration_service: AppraisalExpirationService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === APPRAISAL_OFFERS_JOB_NOTIFY_OPPORTUNITY) {
      const { appraisal_id } = job.data as AppraisalNotifyOpportunityJobData;
      const appraisal = await this.appraisal_repository.findOne({
        where: { id: appraisal_id },
        relations: APPRAISAL_VIEW_RELATIONS,
      });
      if (appraisal?.status === APPRAISAL_REQUEST_STATUS.OPEN_FOR_OFFERS) {
        await this.notification_service.notifyOpportunity(appraisal);
      }
      return;
    }

    if (job.name === APPRAISAL_OFFERS_JOB_EXPIRE) {
      await this.expiration_service.expireDue();
    }
  }
}
