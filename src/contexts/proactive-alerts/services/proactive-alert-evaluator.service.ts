import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { VehicleInsightsService } from "@/src/contexts/vehicles/services/vehicle-insights.service";
import { TypeOrmLeadRepository } from "@/src/contexts/vehicles/repositories/typeorm.lead-repository";
import { VehicleEntity } from "@/src/contexts/vehicles/entities/vehicle.entity";
import { STATUS_VEHICLE } from "@/src/contexts/vehicles/types/vehicle";
import {
  FUNNEL_METRIC_KEY,
  type FunnelMetric,
} from "@/src/contexts/vehicles/types/vehicle-insights";

import { PROACTIVE_ALERT_TYPE } from "../constants/proactive-alert-types";
import { ProactiveAlertDispatchService } from "./proactive-alert-dispatch.service";
import {
  evaluateFeaturedExpiring,
  evaluateFeaturedRecommended,
  evaluateLeadsPendingReply,
  evaluateListingHealthLow,
  evaluatePriceAboveMarket,
  evaluateStaleLowViews,
  evaluateViewsNoLeads,
  evaluateWeeklySummary,
} from "../utils/proactive-alert-rules";

@Injectable()
export class ProactiveAlertEvaluatorService {
  constructor(
    @InjectRepository(VehicleEntity)
    private readonly vehicle_repository: Repository<VehicleEntity>,
    private readonly vehicle_insights_service: VehicleInsightsService,
    private readonly lead_repository: TypeOrmLeadRepository,
    private readonly dispatch_service: ProactiveAlertDispatchService,
  ) {}

  async runDailyBatchForProfile(profile_id: string): Promise<void> {
    const vehicles = await this.vehicle_repository.find({
      where: { profile_id, status: STATUS_VEHICLE.ACTIVE },
    });

    for (const vehicle of vehicles) {
      await this.evaluateVehicleBatch(profile_id, vehicle.id);
    }

    const pending = await this.lead_repository.countPendingReplyLeads(profile_id, 24);
    const pending_payload = evaluateLeadsPendingReply({ pending_count: pending });
    if (pending_payload) {
      const day = new Date().toISOString().slice(0, 10);
      await this.dispatch_service.tryDispatch({
        profile_id,
        type: PROACTIVE_ALERT_TYPE.LEADS_PENDING_REPLY,
        dedupe_key: `leads_pending_reply:${profile_id}:${day}`,
        payload: pending_payload,
      });
    }
  }

  async runWeeklySummaryForProfile(profile_id: string): Promise<void> {
    const stats = await this.lead_repository.summarizeWeeklyEngagement(profile_id);
    const payload = evaluateWeeklySummary(stats);
    const week = this.isoWeekKey(new Date());
    await this.dispatch_service.tryDispatch({
      profile_id,
      type: PROACTIVE_ALERT_TYPE.WEEKLY_SUMMARY,
      dedupe_key: `weekly_summary:${profile_id}:${week}`,
      payload,
    });
  }

  async evaluateVehicleBatch(profile_id: string, vehicle_id: string): Promise<void> {
    const insights = await this.vehicle_insights_service.getInsights(vehicle_id);

    const views_metric = this.findMetric(
      insights.funnel.metrics,
      FUNNEL_METRIC_KEY.VIEWS,
    );
    const leads_metric = this.findMetric(
      insights.funnel.metrics,
      FUNNEL_METRIC_KEY.LEADS,
    );

    const price_payload = evaluatePriceAboveMarket({
      verdict: insights.price.verdict ?? "",
      suggested_price: insights.price.suggested_price,
      vehicle_id,
    });
    if (price_payload) {
      await this.dispatch_service.tryDispatch({
        profile_id,
        type: PROACTIVE_ALERT_TYPE.PRICE_ABOVE_MARKET,
        dedupe_key: `price_above_market:${vehicle_id}`,
        vehicle_id,
        payload: price_payload,
      });
    }

    const stale_payload = evaluateStaleLowViews({
      days_published: insights.funnel.listing_age_days,
      daily_views: views_metric?.daily_rate ?? 0,
      segment_daily_views: views_metric?.segment_daily_rate ?? 1,
      suggested_price_drop_eur: 500,
      vehicle_id,
    });
    if (stale_payload) {
      await this.dispatch_service.tryDispatch({
        profile_id,
        type: PROACTIVE_ALERT_TYPE.STALE_LOW_VIEWS,
        dedupe_key: `stale_low_views:${vehicle_id}`,
        vehicle_id,
        payload: stale_payload,
      });
    }

    const leads_14d = await this.lead_repository.countLeadsForVehicleSinceDays(
      vehicle_id,
      14,
    );
    const views_no_leads = evaluateViewsNoLeads({
      vehicle_id,
      views_trend: views_metric?.trend ?? "on_par",
      leads_count_14d: leads_14d,
    });
    if (views_no_leads) {
      await this.dispatch_service.tryDispatch({
        profile_id,
        type: PROACTIVE_ALERT_TYPE.VIEWS_NO_LEADS,
        dedupe_key: `views_no_leads:${vehicle_id}`,
        vehicle_id,
        payload: views_no_leads,
      });
    }

    const health_payload = evaluateListingHealthLow({
      vehicle_id,
      health_tier: insights.health.tier,
      primary_issue: insights.health.top_issue?.title ?? "Hay mejoras pendientes",
      cta: insights.health.top_issue?.cta?.label ?? "Revisa tu anuncio",
    });
    if (health_payload) {
      await this.dispatch_service.tryDispatch({
        profile_id,
        type: PROACTIVE_ALERT_TYPE.LISTING_HEALTH_LOW,
        dedupe_key: `listing_health_low:${vehicle_id}`,
        vehicle_id,
        payload: health_payload,
      });
    }

    const featured_payload = evaluateFeaturedRecommended({
      vehicle_id,
      recommendation: insights.featured.recommendation,
      can_feature: insights.featured.can_feature,
    });
    if (featured_payload) {
      await this.dispatch_service.tryDispatch({
        profile_id,
        type: PROACTIVE_ALERT_TYPE.FEATURED_RECOMMENDED,
        dedupe_key: `featured_recommended:${vehicle_id}`,
        vehicle_id,
        payload: featured_payload,
      });
    }

    const hours_left = this.hoursUntil(insights.featured.expires_at);
    const expiring_payload = evaluateFeaturedExpiring({
      vehicle_id,
      hours_left,
    });
    if (expiring_payload) {
      await this.dispatch_service.tryDispatch({
        profile_id,
        type: PROACTIVE_ALERT_TYPE.FEATURED_EXPIRING,
        dedupe_key: `featured_expiring:${vehicle_id}:${insights.featured.expires_at?.toISOString() ?? "none"}`,
        vehicle_id,
        payload: expiring_payload,
      });
    }

    void leads_metric;
  }

  private findMetric(
    metrics: FunnelMetric[],
    key: (typeof FUNNEL_METRIC_KEY)[keyof typeof FUNNEL_METRIC_KEY],
  ): FunnelMetric | undefined {
    return metrics.find((metric) => metric.key === key);
  }

  private hoursUntil(date: Date | null): number {
    if (!date) {
      return 999;
    }
    return (date.getTime() - Date.now()) / (60 * 60 * 1000);
  }

  private isoWeekKey(date: Date): string {
    const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
    const year_start = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((tmp.getTime() - year_start.getTime()) / 86400000 + 1) / 7);
    return `${tmp.getUTCFullYear()}-W${week}`;
  }
}
