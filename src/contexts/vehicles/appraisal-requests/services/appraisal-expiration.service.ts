import { InjectRepository } from "@nestjs/typeorm";
import { LessThanOrEqual, Repository } from "typeorm";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { AppraisalOfferEntity } from "../entities/appraisal-offer.entity";
import { AppraisalRequestEntity } from "../entities/appraisal-request.entity";
import { APPRAISAL_OFFER_STATUS } from "../types/appraisal-offer";
import { APPRAISAL_REQUEST_STATUS } from "../types/appraisal-request";
import { AppraisalNotificationService } from "./appraisal-notification.service";
import { APPRAISAL_VIEW_RELATIONS } from "./appraisal-view.mapper";

/** Cierra las tasaciones cuya ventana de ofertas venció y avisa a cada parte. */
@Injectable()
export class AppraisalExpirationService {
  constructor(
    @InjectRepository(AppraisalRequestEntity)
    private readonly appraisal_repository: Repository<AppraisalRequestEntity>,
    @InjectRepository(AppraisalOfferEntity)
    private readonly offer_repository: Repository<AppraisalOfferEntity>,
    private readonly notification_service: AppraisalNotificationService,
  ) {}

  async expireDue(now: Date = new Date()): Promise<number> {
    const due = await this.appraisal_repository.find({
      where: {
        status: APPRAISAL_REQUEST_STATUS.OPEN_FOR_OFFERS,
        offers_expire_at: LessThanOrEqual(now),
      },
      relations: APPRAISAL_VIEW_RELATIONS,
    });

    for (const appraisal of due) {
      const pending = await this.offer_repository.find({
        where: {
          appraisal_request_id: appraisal.id,
          status: APPRAISAL_OFFER_STATUS.PENDING,
        },
      });

      await this.appraisal_repository.update(appraisal.id, {
        status: APPRAISAL_REQUEST_STATUS.EXPIRED,
      });
      if (pending.length > 0) {
        await this.offer_repository.update(
          pending.map((offer) => offer.id),
          { status: APPRAISAL_OFFER_STATUS.EXPIRED, responded_at: now },
        );
      }

      await this.notification_service.notifySellerExpired(appraisal);
      await this.notification_service.notifyDealershipsClosed(
        appraisal,
        pending.map((offer) => offer.dealership_id),
        "expired",
      );
    }

    return due.length;
  }
}
