import { InjectQueue } from "@nestjs/bullmq";
import { BadRequestException, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Queue } from "bullmq";
import { DataSource, Repository } from "typeorm";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { VersionEntity } from "../../catalog/versions/entities/version.entity";
import { InvalidateVehicleVersionIdException } from "../../exceptions/InvalidateVehicleVersionId.exception";
import { RecommendVehiclePriceService } from "../../services/recommend-vehicle-price.service";
import { CONDITION_VEHICLE, TransmissionType } from "../../types/vehicle";
import { AppraisalOfferEntity } from "../entities/appraisal-offer.entity";
import { AppraisalRequestEntity } from "../entities/appraisal-request.entity";
import { AppraisalRequestNotFoundException } from "../exceptions/appraisal-request-not-found.exception";
import {
  APPRAISAL_OFFERS_JOB_NOTIFY_OPPORTUNITY,
  APPRAISAL_OFFERS_QUEUE,
  type AppraisalNotifyOpportunityJobData,
} from "../queues/appraisal-offers.queue.constants";
import type { AppraisalDetail, AppraisalListItem } from "../types/appraisal";
import {
  APPRAISAL_OFFER_STATUS,
  APPRAISAL_OFFERS_WINDOW_DAYS,
} from "../types/appraisal-offer";
import {
  APPRAISAL_REQUEST_PRIORITY,
  APPRAISAL_REQUEST_STATUS,
} from "../types/appraisal-request";
import { AppraisalNotificationService } from "./appraisal-notification.service";
import {
  APPRAISAL_VIEW_RELATIONS,
  isLiveOffer,
  toAppraisalContact,
  toAppraisalEstimate,
  toAppraisalOfferView,
  toAppraisalVehicle,
  trimToNull,
} from "./appraisal-view.mapper";

export interface EstimateAppraisalPayload {
  version_id: number;
  transmission_type: TransmissionType;
  mileage: number;
  power?: number;
  plate?: string;
  name: string;
  last_name?: string;
  email: string;
  phone_code: string;
  phone: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const normalizePlate = (plate: string | undefined): string | null =>
  trimToNull(plate)?.toUpperCase() ?? null;

/** Tasación IA del lado del vendedor: estimar, pedir ofertas y responderlas. */
@Injectable()
export class AppraisalEstimateService {
  constructor(
    @InjectRepository(AppraisalRequestEntity)
    private readonly appraisal_repository: Repository<AppraisalRequestEntity>,
    @InjectRepository(AppraisalOfferEntity)
    private readonly offer_repository: Repository<AppraisalOfferEntity>,
    @InjectRepository(VersionEntity)
    private readonly version_repository: Repository<VersionEntity>,
    private readonly recommend_vehicle_price_service: RecommendVehiclePriceService,
    private readonly notification_service: AppraisalNotificationService,
    private readonly data_source: DataSource,
    @InjectQueue(APPRAISAL_OFFERS_QUEUE)
    private readonly queue: Queue,
  ) {}

  async estimate(
    profile_id: string,
    payload: EstimateAppraisalPayload,
  ): Promise<AppraisalDetail> {
    const version = await this.version_repository.findOne({
      where: { id: payload.version_id },
    });
    if (!version) {
      throw new InvalidateVehicleVersionIdException();
    }

    const name = [payload.name, payload.last_name]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(" ");
    if (!name || !payload.email.trim() || !payload.phone.trim()) {
      throw new BadRequestException("Los datos de contacto son obligatorios");
    }

    const recommendation = await this.recommend_vehicle_price_service.execute(
      {
        version_id: payload.version_id,
        condition: CONDITION_VEHICLE.USED,
        mileage: payload.mileage,
        transmission_type: payload.transmission_type,
        power: payload.power,
      },
      profile_id,
    );

    const saved = await this.appraisal_repository.save(
      this.appraisal_repository.create({
        make_id: version.make_id,
        model_id: version.model_id,
        year_id: version.year_id,
        version_id: version.id,
        fuel_type_id: version.fuel_type_id,
        body_type_id: version.body_type_id,
        transmission_type: payload.transmission_type,
        mileage: payload.mileage,
        power: payload.power ?? null,
        plate: normalizePlate(payload.plate),
        lat: null,
        lng: null,
        address: null,
        name,
        email: payload.email.trim(),
        phone_code: payload.phone_code.trim(),
        phone: payload.phone.trim(),
        profile_id,
        priority: APPRAISAL_REQUEST_PRIORITY.HIGH,
        status: APPRAISAL_REQUEST_STATUS.ESTIMATED,
        recommended_price: recommendation.recommended_price,
        estimated_price_min: recommendation.range_min,
        estimated_price_max: recommendation.range_max,
        ai_explanation: recommendation.explanation,
        ai_confidence: recommendation.confidence,
        ai_source: recommendation.source,
      }),
    );

    return this.findMine(profile_id, saved.id);
  }

  async findAllMine(profile_id: string): Promise<AppraisalListItem[]> {
    const rows = await this.appraisal_repository.find({
      where: { profile_id },
      relations: [...APPRAISAL_VIEW_RELATIONS, "offers"],
      order: { created_at: "DESC" },
    });

    return rows.map((row) => {
      const live_offers = row.offers.filter((offer) => isLiveOffer(offer));
      const amounts = live_offers.map((offer) => Number(offer.amount));

      return {
        id: row.id,
        status: row.status,
        created_at: row.created_at,
        offers_expire_at: row.offers_expire_at,
        vehicle: toAppraisalVehicle(row),
        estimate: toAppraisalEstimate(row),
        offers_count: live_offers.length,
        best_offer_amount: amounts.length > 0 ? Math.max(...amounts) : null,
      };
    });
  }

  async findMine(profile_id: string, id: string): Promise<AppraisalDetail> {
    const row = await this.findOwnedOrFail(profile_id, id);
    const offers = await this.offer_repository.find({
      where: { appraisal_request_id: id },
      relations: ["dealership"],
      order: { amount: "DESC" },
    });

    return {
      id: row.id,
      status: row.status,
      created_at: row.created_at,
      offers_requested_at: row.offers_requested_at,
      offers_expire_at: row.offers_expire_at,
      accepted_offer_id: row.accepted_offer_id,
      vehicle: toAppraisalVehicle(row),
      estimate: toAppraisalEstimate(row),
      contact: toAppraisalContact(row),
      offers: offers
        .filter((offer) => isLiveOffer(offer))
        .map((offer) => toAppraisalOfferView(offer)),
    };
  }

  /** Abre la tasación a ofertas durante `APPRAISAL_OFFERS_WINDOW_DAYS`. Idempotente. */
  async requestOffers(profile_id: string, id: string): Promise<AppraisalDetail> {
    const row = await this.findOwnedOrFail(profile_id, id);

    if (row.status === APPRAISAL_REQUEST_STATUS.OPEN_FOR_OFFERS) {
      return this.findMine(profile_id, id);
    }

    const can_open =
      row.status === APPRAISAL_REQUEST_STATUS.ESTIMATED ||
      row.status === APPRAISAL_REQUEST_STATUS.EXPIRED;
    if (!can_open) {
      throw new ConflictException("Esta tasación ya no admite nuevas ofertas");
    }

    const now = new Date();
    await this.appraisal_repository.update(id, {
      status: APPRAISAL_REQUEST_STATUS.OPEN_FOR_OFFERS,
      offers_requested_at: now,
      offers_expire_at: new Date(now.getTime() + APPRAISAL_OFFERS_WINDOW_DAYS * DAY_MS),
    });

    const job_data: AppraisalNotifyOpportunityJobData = { appraisal_id: id };
    await this.queue.add(APPRAISAL_OFFERS_JOB_NOTIFY_OPPORTUNITY, job_data, {
      jobId: `${APPRAISAL_OFFERS_JOB_NOTIFY_OPPORTUNITY}:${id}:${now.getTime()}`,
      removeOnComplete: true,
      removeOnFail: 100,
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
    });

    return this.findMine(profile_id, id);
  }

  /**
   * Acepta una oferta: el resto de ofertas pendientes se rechazan y la tasación se
   * cierra. Solo entonces el concesionario ganador recibe los datos de contacto.
   */
  async acceptOffer(
    profile_id: string,
    id: string,
    offer_id: string,
  ): Promise<AppraisalDetail> {
    const row = await this.findOwnedOrFail(profile_id, id);
    if (row.status !== APPRAISAL_REQUEST_STATUS.OPEN_FOR_OFFERS) {
      throw new ConflictException("Esta tasación no está abierta a ofertas");
    }

    const { accepted, closed_dealership_ids } = await this.data_source.transaction(
      async (manager) => {
        const offer = await manager.findOne(AppraisalOfferEntity, {
          where: { id: offer_id, appraisal_request_id: id },
          lock: { mode: "pessimistic_write" },
        });
        if (!offer || offer.status !== APPRAISAL_OFFER_STATUS.PENDING) {
          throw new ConflictException("La oferta ya no está disponible");
        }

        const now = new Date();
        // eslint-disable-next-line unicorn/no-array-method-this-argument -- EntityManager.find, no Array#find
        const others = await manager.find(AppraisalOfferEntity, {
          where: { appraisal_request_id: id, status: APPRAISAL_OFFER_STATUS.PENDING },
        });
        const rejected = others.filter((other) => other.id !== offer.id);

        if (rejected.length > 0) {
          await manager.update(
            AppraisalOfferEntity,
            rejected.map((other) => other.id),
            { status: APPRAISAL_OFFER_STATUS.REJECTED, responded_at: now },
          );
        }
        await manager.update(AppraisalOfferEntity, offer.id, {
          status: APPRAISAL_OFFER_STATUS.ACCEPTED,
          responded_at: now,
        });
        await manager.update(AppraisalRequestEntity, id, {
          status: APPRAISAL_REQUEST_STATUS.OFFER_ACCEPTED,
          accepted_offer_id: offer.id,
        });

        return {
          accepted: offer,
          closed_dealership_ids: rejected.map((other) => other.dealership_id),
        };
      },
    );

    await this.notification_service.notifyDealershipOfferAccepted(row, accepted);
    await this.notification_service.notifyDealershipsClosed(
      row,
      closed_dealership_ids,
      "accepted_other",
    );

    return this.findMine(profile_id, id);
  }

  async rejectOffer(
    profile_id: string,
    id: string,
    offer_id: string,
  ): Promise<AppraisalDetail> {
    const row = await this.findOwnedOrFail(profile_id, id);
    const offer = await this.offer_repository.findOne({
      where: { id: offer_id, appraisal_request_id: id },
    });
    if (!offer || offer.status !== APPRAISAL_OFFER_STATUS.PENDING) {
      throw new ConflictException("La oferta ya no está disponible");
    }

    await this.offer_repository.update(offer.id, {
      status: APPRAISAL_OFFER_STATUS.REJECTED,
      responded_at: new Date(),
    });
    await this.notification_service.notifyDealershipOfferRejected(row, offer);

    return this.findMine(profile_id, id);
  }

  private async findOwnedOrFail(
    profile_id: string,
    id: string,
  ): Promise<AppraisalRequestEntity> {
    const row = await this.appraisal_repository.findOne({
      where: { id, profile_id },
      relations: APPRAISAL_VIEW_RELATIONS,
    });
    if (!row) {
      throw new AppraisalRequestNotFoundException(id);
    }
    return row;
  }
}
