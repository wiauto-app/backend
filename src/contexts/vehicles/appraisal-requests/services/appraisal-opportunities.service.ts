import { ConflictException, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { DealershipMembersEntity } from "@/src/contexts/dealership/entities/dealership-members.entity";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { getSkip } from "@/src/contexts/shared/getSkip";
import { User } from "@/src/contexts/users/entities/user.entity";

import { AppraisalOfferEntity } from "../entities/appraisal-offer.entity";
import { AppraisalRequestEntity } from "../entities/appraisal-request.entity";
import { AppraisalRequestNotFoundException } from "../exceptions/appraisal-request-not-found.exception";
import type { AppraisalOpportunity } from "../types/appraisal";
import { APPRAISAL_OFFER_STATUS } from "../types/appraisal-offer";
import { APPRAISAL_REQUEST_STATUS } from "../types/appraisal-request";
import { AppraisalNotificationService } from "./appraisal-notification.service";
import {
  APPRAISAL_VIEW_RELATIONS,
  isLiveOffer,
  toAppraisalContact,
  toAppraisalEstimate,
  toAppraisalVehicle,
  trimToNull,
} from "./appraisal-view.mapper";

export const APPRAISAL_OPPORTUNITY_SCOPE = {
  /** Tasaciones abiertas a ofertas. */
  OPEN: "open",
  /** Tasaciones en las que el concesionario ofertó (cualquier estado). */
  MINE: "mine",
} as const;

export type AppraisalOpportunityScope =
  (typeof APPRAISAL_OPPORTUNITY_SCOPE)[keyof typeof APPRAISAL_OPPORTUNITY_SCOPE];

export interface FindAppraisalOpportunitiesPayload {
  page: number;
  limit: number;
  scope: AppraisalOpportunityScope;
}

export interface UpsertAppraisalOfferPayload {
  amount: number;
  message?: string;
}

interface AppraisalOpportunityActor {
  profile_id: string;
  is_platform_admin: boolean;
  membership: DealershipMembersEntity | null;
}

/** Tasaciones del lado del concesionario (owner/admin) o de un admin de plataforma. El vendedor es anónimo hasta aceptar. */
@Injectable()
export class AppraisalOpportunitiesService {
  constructor(
    @InjectRepository(AppraisalRequestEntity)
    private readonly appraisal_repository: Repository<AppraisalRequestEntity>,
    @InjectRepository(AppraisalOfferEntity)
    private readonly offer_repository: Repository<AppraisalOfferEntity>,
    @InjectRepository(DealershipMembersEntity)
    private readonly member_repository: Repository<DealershipMembersEntity>,
    @InjectRepository(User)
    private readonly user_repository: Repository<User>,
    private readonly notification_service: AppraisalNotificationService,
  ) {}

  async findAll(
    profile_id: string,
    payload: FindAppraisalOpportunitiesPayload,
  ): Promise<PaginatedResult<AppraisalOpportunity>> {
    const actor = await this.resolveActorOrFail(profile_id);
    const dealership_id = actor.membership?.dealership_id ?? null;

    if (payload.scope === APPRAISAL_OPPORTUNITY_SCOPE.MINE && !dealership_id) {
      return new PaginatedResult([], 0, payload.page, payload.limit);
    }

    const query = this.appraisal_repository
      .createQueryBuilder("appraisal")
      .leftJoinAndSelect("appraisal.make", "make")
      .leftJoinAndSelect("appraisal.model", "model")
      .leftJoinAndSelect("appraisal.year", "year")
      .leftJoinAndSelect("appraisal.version", "version")
      .leftJoinAndSelect("version.fuel_type", "fuel_type")
      .orderBy("appraisal.offers_requested_at", "DESC")
      .skip(getSkip(payload.page, payload.limit))
      .take(payload.limit);

    if (payload.scope === APPRAISAL_OPPORTUNITY_SCOPE.MINE) {
      query.where(
        `EXISTS (SELECT 1 FROM appraisal_offers offer
          WHERE offer.appraisal_request_id = appraisal.id
            AND offer.dealership_id = :dealership_id)`,
        { dealership_id },
      );
    } else {
      query
        .where("appraisal.status = :status", {
          status: APPRAISAL_REQUEST_STATUS.OPEN_FOR_OFFERS,
        })
        .andWhere("appraisal.offers_expire_at > now()");
    }

    const [rows, total] = await query.getManyAndCount();
    const offers = await this.findOffersFor(rows.map((row) => row.id));
    const data = rows.map((row) => this.toOpportunity(row, offers, dealership_id));

    return new PaginatedResult(data, total, payload.page, payload.limit);
  }

  async findOne(profile_id: string, id: string): Promise<AppraisalOpportunity> {
    const actor = await this.resolveActorOrFail(profile_id);
    const dealership_id = actor.membership?.dealership_id ?? null;
    const row = await this.findVisibleOrFail(
      id,
      dealership_id,
      actor.is_platform_admin,
    );
    const offers = await this.findOffersFor([id]);
    return this.toOpportunity(row, offers, dealership_id);
  }

  /** Crea o actualiza la oferta del concesionario mientras la tasación esté abierta. */
  async upsertOffer(
    profile_id: string,
    id: string,
    payload: UpsertAppraisalOfferPayload,
  ): Promise<AppraisalOpportunity> {
    const actor = await this.resolveActorOrFail(profile_id);
    const membership = this.requireDealershipMembership(actor);
    const row = await this.findOpenOrFail(id);
    const message = trimToNull(payload.message);

    const existing = await this.offer_repository.findOne({
      where: {
        appraisal_request_id: id,
        dealership_id: membership.dealership_id,
        status: APPRAISAL_OFFER_STATUS.PENDING,
      },
    });

    const offer = existing
      ? await this.offer_repository.save({
          ...existing,
          amount: payload.amount,
          message,
          created_by_profile_id: profile_id,
        })
      : await this.offer_repository.save(
          this.offer_repository.create({
            appraisal_request_id: id,
            dealership_id: membership.dealership_id,
            created_by_profile_id: profile_id,
            amount: payload.amount,
            message,
            status: APPRAISAL_OFFER_STATUS.PENDING,
          }),
        );

    await this.notification_service.notifySellerNewOffer(
      row,
      offer,
      membership.dealership.name,
      Boolean(existing),
    );

    return this.findOne(profile_id, id);
  }

  async withdrawOffer(profile_id: string, id: string): Promise<AppraisalOpportunity> {
    const actor = await this.resolveActorOrFail(profile_id);
    const membership = this.requireDealershipMembership(actor);
    await this.findOpenOrFail(id);

    const result = await this.offer_repository.update(
      {
        appraisal_request_id: id,
        dealership_id: membership.dealership_id,
        status: APPRAISAL_OFFER_STATUS.PENDING,
      },
      { status: APPRAISAL_OFFER_STATUS.WITHDRAWN, responded_at: new Date() },
    );
    if (!result.affected) {
      throw new ConflictException("No tienes una oferta activa en esta tasación");
    }

    return this.findOne(profile_id, id);
  }

  private toOpportunity(
    row: AppraisalRequestEntity,
    offers: AppraisalOfferEntity[],
    dealership_id: string | null,
  ): AppraisalOpportunity {
    const row_offers = offers.filter((offer) => offer.appraisal_request_id === row.id);
    const mine = dealership_id
      ? row_offers
          .filter((offer) => offer.dealership_id === dealership_id)
          .sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime())
          .at(0)
      : undefined;
    const is_winner =
      mine !== undefined &&
      mine.status === APPRAISAL_OFFER_STATUS.ACCEPTED &&
      row.accepted_offer_id === mine.id;

    return {
      id: row.id,
      status: row.status,
      created_at: row.created_at,
      offers_expire_at: row.offers_expire_at,
      vehicle: toAppraisalVehicle(row),
      estimate: toAppraisalEstimate(row),
      offers_count: row_offers.filter((offer) => isLiveOffer(offer)).length,
      my_offer: mine
        ? {
            id: mine.id,
            amount: Number(mine.amount),
            message: mine.message,
            status: mine.status,
            updated_at: mine.updated_at,
          }
        : null,
      // Privacidad: el contacto solo se revela al concesionario cuya oferta se aceptó.
      seller_contact: is_winner ? toAppraisalContact(row) : null,
    };
  }

  private findOffersFor(appraisal_ids: string[]): Promise<AppraisalOfferEntity[]> {
    if (appraisal_ids.length === 0) {
      return Promise.resolve([]);
    }
    return this.offer_repository.find({
      where: { appraisal_request_id: In(appraisal_ids) },
    });
  }

  /** Abierta, cualquiera en la que este concesionario ya ofertó, o cualquier tasación si es admin de plataforma. */
  private async findVisibleOrFail(
    id: string,
    dealership_id: string | null,
    is_platform_admin: boolean,
  ): Promise<AppraisalRequestEntity> {
    const row = await this.appraisal_repository.findOne({
      where: { id },
      relations: APPRAISAL_VIEW_RELATIONS,
    });
    if (!row) {
      throw new AppraisalRequestNotFoundException(id);
    }

    if (is_platform_admin || row.status === APPRAISAL_REQUEST_STATUS.OPEN_FOR_OFFERS) {
      return row;
    }

    if (!dealership_id) {
      throw new AppraisalRequestNotFoundException(id);
    }

    const has_offer = await this.offer_repository.exists({
      where: { appraisal_request_id: id, dealership_id },
    });
    if (!has_offer) {
      throw new AppraisalRequestNotFoundException(id);
    }
    return row;
  }

  private async findOpenOrFail(id: string): Promise<AppraisalRequestEntity> {
    const row = await this.appraisal_repository.findOne({
      where: { id },
      relations: APPRAISAL_VIEW_RELATIONS,
    });
    if (!row) {
      throw new AppraisalRequestNotFoundException(id);
    }

    const is_open =
      row.status === APPRAISAL_REQUEST_STATUS.OPEN_FOR_OFFERS &&
      (row.offers_expire_at === null || row.offers_expire_at > new Date());
    if (!is_open) {
      throw new ConflictException("Esta tasación ya no acepta ofertas");
    }
    return row;
  }

  /**
   * Owner/admin del concesionario, o admin de plataforma (`users.is_admin`) aunque no tenga membership.
   */
  private async resolveActorOrFail(
    profile_id: string,
  ): Promise<AppraisalOpportunityActor> {
    const user = await this.user_repository.findOne({
      where: { id: profile_id },
      select: ["id", "is_admin"],
    });
    if (!user) {
      throw new ForbiddenException("Usuario no encontrado");
    }

    const membership = await this.member_repository.findOne({
      where: { profile_id },
      relations: ["dealership"],
    });

    if (user.is_admin) {
      return { profile_id, is_platform_admin: true, membership };
    }

    if (!membership) {
      throw new ForbiddenException("No perteneces a ningún concesionario");
    }
    if (membership.role !== "owner" && membership.role !== "admin") {
      throw new ForbiddenException(
        "Solo el propietario o un administrador del concesionario puede ofertar",
      );
    }

    return { profile_id, is_platform_admin: false, membership };
  }

  private requireDealershipMembership(
    actor: AppraisalOpportunityActor,
  ): DealershipMembersEntity {
    if (actor.membership) {
      return actor.membership;
    }
    throw new ForbiddenException(
      "Necesitas pertenecer a un concesionario para ofertar",
    );
  }
}
