import { Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { PUSH_TYPE } from "@/src/contexts/alerts/types/push-message";
import { NotificationChannelDispatcher } from "@/src/contexts/alerts/services/notification-channel-dispatcher.service";
import { DealershipMembersEntity } from "@/src/contexts/dealership/entities/dealership-members.entity";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { AppraisalOfferEntity } from "../entities/appraisal-offer.entity";
import { AppraisalRequestEntity } from "../entities/appraisal-request.entity";
import { formatEur, toAppraisalVehicle } from "./appraisal-view.mapper";

export const APPRAISAL_NOTIFICATION_CATEGORY = {
  OPPORTUNITY: "appraisal_opportunity",
  OFFER: "appraisal_offer",
  OFFER_ACCEPTED: "appraisal_offer_accepted",
  OFFER_REJECTED: "appraisal_offer_rejected",
  CLOSED: "appraisal_closed",
} as const;

const MANAGER_ROLES = ["owner", "admin"] as const;

export const sellerAppraisalUrl = (appraisal_id: string): string =>
  `/usuario/mi-tasador/${appraisal_id}`;

export const dealerOpportunityUrl = (appraisal_id: string): string =>
  `/usuario/oportunidades-tasacion/${appraisal_id}`;

/** Notificaciones del flujo de tasaciones (push, email e in-app vía el dispatcher). */
@Injectable()
export class AppraisalNotificationService {
  private readonly logger = new Logger(AppraisalNotificationService.name);

  constructor(
    private readonly notification_channel_dispatcher: NotificationChannelDispatcher,
    @InjectRepository(DealershipMembersEntity)
    private readonly member_repository: Repository<DealershipMembersEntity>,
  ) {}

  /** A todos los owner/admin de todos los concesionarios. */
  async notifyOpportunity(appraisal: AppraisalRequestEntity): Promise<void> {
    const profile_ids = await this.findManagerProfileIds();
    const vehicle = toAppraisalVehicle(appraisal);

    for (const profile_id of profile_ids) {
      await this.notify(profile_id, {
        category: APPRAISAL_NOTIFICATION_CATEGORY.OPPORTUNITY,
        title: "Nueva tasación disponible",
        body: `${vehicle.vehicle_label} · ${vehicle.mileage.toLocaleString("es-ES")} km. Envía tu oferta de compra.`,
        appraisal_id: appraisal.id,
        url: dealerOpportunityUrl(appraisal.id),
      });
    }
  }

  async notifySellerNewOffer(
    appraisal: AppraisalRequestEntity,
    offer: AppraisalOfferEntity,
    dealership_name: string,
    is_update: boolean,
  ): Promise<void> {
    if (!appraisal.profile_id) {
      return;
    }

    await this.notify(appraisal.profile_id, {
      category: APPRAISAL_NOTIFICATION_CATEGORY.OFFER,
      title: is_update ? "Oferta actualizada" : "Nueva oferta por tu coche",
      body: `${dealership_name} ofrece ${formatEur(Number(offer.amount))} por tu ${toAppraisalVehicle(appraisal).vehicle_label}.`,
      appraisal_id: appraisal.id,
      url: sellerAppraisalUrl(appraisal.id),
    });
  }

  async notifyDealershipOfferAccepted(
    appraisal: AppraisalRequestEntity,
    offer: AppraisalOfferEntity,
  ): Promise<void> {
    const vehicle = toAppraisalVehicle(appraisal);
    await this.notifyDealership(offer.dealership_id, {
      category: APPRAISAL_NOTIFICATION_CATEGORY.OFFER_ACCEPTED,
      title: "¡Tu oferta fue aceptada!",
      body: `${appraisal.name} aceptó tu oferta de ${formatEur(Number(offer.amount))} por el ${vehicle.vehicle_label}. Contacto: ${appraisal.phone_code} ${appraisal.phone} · ${appraisal.email}.`,
      appraisal_id: appraisal.id,
      url: dealerOpportunityUrl(appraisal.id),
    });
  }

  async notifyDealershipOfferRejected(
    appraisal: AppraisalRequestEntity,
    offer: AppraisalOfferEntity,
  ): Promise<void> {
    await this.notifyDealership(offer.dealership_id, {
      category: APPRAISAL_NOTIFICATION_CATEGORY.OFFER_REJECTED,
      title: "Oferta rechazada",
      body: `El vendedor rechazó tu oferta de ${formatEur(Number(offer.amount))} por el ${toAppraisalVehicle(appraisal).vehicle_label}.`,
      appraisal_id: appraisal.id,
      url: dealerOpportunityUrl(appraisal.id),
    });
  }

  /** Avisa a los concesionarios con oferta pendiente de que la tasación se cerró. */
  async notifyDealershipsClosed(
    appraisal: AppraisalRequestEntity,
    dealership_ids: string[],
    reason: "accepted_other" | "expired",
  ): Promise<void> {
    const vehicle = toAppraisalVehicle(appraisal);
    const body =
      reason === "expired"
        ? `La tasación del ${vehicle.vehicle_label} venció sin cerrarse.`
        : `El vendedor del ${vehicle.vehicle_label} aceptó otra oferta.`;

    for (const dealership_id of new Set(dealership_ids)) {
      await this.notifyDealership(dealership_id, {
        category: APPRAISAL_NOTIFICATION_CATEGORY.CLOSED,
        title: "Tasación cerrada",
        body,
        appraisal_id: appraisal.id,
        url: dealerOpportunityUrl(appraisal.id),
      });
    }
  }

  async notifySellerExpired(appraisal: AppraisalRequestEntity): Promise<void> {
    if (!appraisal.profile_id) {
      return;
    }

    await this.notify(appraisal.profile_id, {
      category: APPRAISAL_NOTIFICATION_CATEGORY.CLOSED,
      title: "Tu solicitud de ofertas venció",
      body: `La ventana de ofertas del ${toAppraisalVehicle(appraisal).vehicle_label} terminó. Puedes volver a solicitar ofertas cuando quieras.`,
      appraisal_id: appraisal.id,
      url: sellerAppraisalUrl(appraisal.id),
    });
  }

  private async notifyDealership(
    dealership_id: string,
    input: NotifyAppraisalInput,
  ): Promise<void> {
    const members = await this.member_repository.find({
      where: { dealership_id, role: In([...MANAGER_ROLES]) },
      select: { profile_id: true },
    });

    for (const member of members) {
      await this.notify(member.profile_id, input);
    }
  }

  private async findManagerProfileIds(): Promise<string[]> {
    const rows = await this.member_repository
      .createQueryBuilder("member")
      .select("DISTINCT member.profile_id", "profile_id")
      .where("member.role IN (:...roles)", { roles: MANAGER_ROLES })
      .getRawMany<{ profile_id: string }>();

    return rows.map((row) => row.profile_id);
  }

  private async notify(
    profile_id: string,
    input: NotifyAppraisalInput,
  ): Promise<void> {
    // Una notificación fallida no debe cortar el flujo ni el resto de envíos.
    try {
      await this.notification_channel_dispatcher.notify({
        profile_id,
        category: input.category,
        title: input.title,
        body: input.body,
        push_type: PUSH_TYPE.APPRAISAL,
        data: { appraisal_id: input.appraisal_id, url: input.url },
      });
    } catch (error) {
      this.logger.warn(
        `appraisal.notify.failed profile=${profile_id} category=${input.category} error=${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

interface NotifyAppraisalInput {
  category: string;
  title: string;
  body: string;
  appraisal_id: string;
  url: string;
}
