import { Logger } from "@nestjs/common";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import {
  formatVehicleDisplayName,
  type VehicleDisplayNameParts,
} from "@/src/contexts/vehicles/utils/format-vehicle-display-name";

import { PROACTIVE_ALERT_TYPE } from "../constants/proactive-alert-types";
import { ProactiveAlertEnqueueService } from "../queues/proactive-alerts-enqueue.service";
import {
  evaluateHotLeadUnanswered,
  evaluateMatchingBuyerSearch,
} from "../utils/proactive-alert-rules";
import { ProactiveAlertDispatchService } from "./proactive-alert-dispatch.service";
import { TypeOrmLeadRepository } from "@/src/contexts/vehicles/repositories/typeorm.lead-repository";
import { LEAD_TIER } from "@/src/contexts/vehicles/types/lead-scoring";

const HOT_LEAD_DELAY_MS = 2 * 60 * 60 * 1000;

export interface PremiumListingNotifyItem {
  id: string;
  is_premium: boolean;
  publisher: { id: string };
  version_summary: VehicleDisplayNameParts;
}

@Injectable()
export class ProactiveAlertEventService {
  private readonly logger = new Logger(ProactiveAlertEventService.name);

  constructor(
    private readonly dispatch_service: ProactiveAlertDispatchService,
    private readonly enqueue_service: ProactiveAlertEnqueueService,
    private readonly lead_repository: TypeOrmLeadRepository,
  ) {}

  async notifyPremiumSellersFromListingPage(params: {
    viewer_profile_id: string;
    models_slugs: string[];
    listing_items: PremiumListingNotifyItem[];
  }): Promise<void> {
    try {
      if (params.models_slugs.length === 0) {
        return;
      }

      for (const item of params.listing_items) {
        if (!item.is_premium) {
          continue;
        }

        const seller_profile_id = item.publisher.id;
        if (seller_profile_id === params.viewer_profile_id) {
          continue;
        }

        const vehicle_title = formatVehicleDisplayName(item.version_summary);
        await this.onMatchingBuyerSearch({
          seller_profile_id,
          vehicle_id: item.id,
          vehicle_title,
        });
      }
    } catch (error: unknown) {
      this.logger.error(
        "notifyPremiumSellersFromListingPage falló",
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async onMatchingBuyerSearch(params: {
    seller_profile_id: string;
    vehicle_id: string;
    vehicle_title: string;
  }): Promise<void> {
    console.log("onMatchingBuyerSearch", params);
    const payload = evaluateMatchingBuyerSearch({
      vehicle_id: params.vehicle_id,
      vehicle_title: params.vehicle_title,
    });
    console.log("payload", payload);
    const day_key = new Date().toISOString().slice(0, 10);
    await this.dispatch_service.tryDispatch({
      profile_id: params.seller_profile_id,
      type: PROACTIVE_ALERT_TYPE.MATCHING_BUYER_SEARCH,
      dedupe_key: `matching_buyer_search:${params.vehicle_id}:${day_key}`,
      vehicle_id: params.vehicle_id,
      payload,
    });
  }

  async onVehiclePublished(params: {
    seller_profile_id: string;
    vehicle_id: string;
    price: number;
    model_key: string;
  }): Promise<void> {
    await this.enqueue_service.enqueueVehiclePublished(params);
  }

  scheduleHotLeadUnansweredCheck(lead_id: string, seller_profile_id: string): Promise<void> {
    return this.enqueue_service.enqueueHotLeadCheck(
      { lead_id, seller_profile_id },
      HOT_LEAD_DELAY_MS,
    );
  }

  async runHotLeadUnansweredCheck(lead_id: string): Promise<void> {
    const lead = await this.lead_repository.findEntityById(lead_id);
    if (!lead || lead.tier !== LEAD_TIER.HOT) {
      return;
    }
    const unanswered_hours = await this.lead_repository.hoursSinceLeadWithoutSellerReply(
      lead_id,
    );
    const payload = evaluateHotLeadUnanswered({
      lead_id: lead.id,
      lead_name: lead.name,
      vehicle_id: lead.vehicle_id,
      hours_unanswered: unanswered_hours,
    });
    if (!payload) {
      return;
    }
    await this.dispatch_service.tryDispatch({
      profile_id: lead.seller_profile_id,
      type: PROACTIVE_ALERT_TYPE.HOT_LEAD_UNANSWERED,
      dedupe_key: `hot_lead_unanswered:${lead_id}`,
      vehicle_id: lead.vehicle_id,
      payload,
    });
  }
}
