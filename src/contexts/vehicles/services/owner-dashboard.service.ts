import { BadRequestException } from "@nestjs/common";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { envs } from "@/src/common/envs";
import { ChatService } from "@/src/contexts/chat/services/chat.service";
import { TypeOrmDealershipMemberRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-member-repository";
import { TypeOrmDealershipRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-repository";

import type {
  OwnerDashboard,
  OwnerDashboardDealership,
  OwnerDashboardPriceDeviation,
  OwnerDashboardPriceDeviationItem,
} from "../types/owner-dashboard";
import { TypeOrmOwnerDashboardRepository } from "@/src/contexts/vehicles/repositories/typeorm.owner-dashboard-repository";
import {
  buildOwnerDashboardSummary,
  buildQualityDistribution,
  buildStockAgeBuckets,
  calculateListingQualityScore,
  OwnerDashboardDateRangeError,
  resolveOwnerDashboardDateRangeBounds,
  WEEKLY_ACTIVITY_DAYS,
} from "../utils/owner-dashboard-rules";
import { GetOwnerDashboardDto } from "../dto/get-owner-dashboard.dto";

const DAY_MS = 24 * 60 * 60 * 1000;
const PRICE_DEVIATION_LIMIT = 5;

@Injectable()
export class OwnerDashboardService {
  constructor(
    private readonly owner_dashboard_repository: TypeOrmOwnerDashboardRepository,
    private readonly chat_service: ChatService,
    private readonly dealership_member_repository: TypeOrmDealershipMemberRepository,
    private readonly dealership_repository: TypeOrmDealershipRepository,
  ) {}

  async getDashboard(dto: GetOwnerDashboardDto): Promise<OwnerDashboard> {
    const now = new Date();
    let bounds;

    try {
      bounds = resolveOwnerDashboardDateRangeBounds({
        start_date: dto.start_date,
        end_date: dto.end_date,
        now,
      });
    } catch (error) {
      if (error instanceof OwnerDashboardDateRangeError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }

    const week_start = new Date(now.getTime() - WEEKLY_ACTIVITY_DAYS * DAY_MS);

    const [
      summary_raw,
      views_time_series,
      weekly_visits,
      weekly_messages_received,
      unread_messages_result,
      inventory_rows,
      price_deviation_rows,
      dealership] = await Promise.all([
      this.owner_dashboard_repository.getSummary({
        profile_id: dto.profile_id,
        current_start: bounds.current_start,
        previous_start: bounds.previous_start,
        period_end: bounds.period_end,
      }),
      this.owner_dashboard_repository.getViewsTimeSeries({
        profile_id: dto.profile_id,
        period_start: bounds.current_start,
        period_end: bounds.period_end,
        granularity: bounds.granularity,
      }),
      this.owner_dashboard_repository.countWeeklyVisits({
        profile_id: dto.profile_id,
        week_start,
        week_end: now,
      }),
      this.owner_dashboard_repository.countWeeklyMessagesReceived({
        profile_id: dto.profile_id,
        week_start,
        week_end: now,
      }),
      this.chat_service.getUnreadTotal({ user_id: dto.profile_id }),
      this.owner_dashboard_repository.getActiveInventoryRows(dto.profile_id, now),
      this.owner_dashboard_repository.getPriceDeviationRows(dto.profile_id),
      this.resolveDealership(dto.profile_id)]);

    const quality_scores = inventory_rows.map((row) =>
      calculateListingQualityScore({
        image_count: row.image_count,
        description_length: row.description_length,
        price: row.price,
        mileage: row.mileage,
        is_featured: row.is_featured,
        featured_expires_at: row.featured_expires_at,
        now,
      }),
    );

    return {
      period: {
        days: bounds.days,
        start: bounds.start.toISOString(),
        end: bounds.end.toISOString(),
        granularity: bounds.granularity,
      },
      summary: buildOwnerDashboardSummary(summary_raw),
      views_time_series,
      weekly_activity: {
        visits: weekly_visits,
        messages_received: weekly_messages_received,
      },
      opportunities: {
        unread_messages: unread_messages_result.total,
      },
      inventory: {
        active_count: inventory_rows.length,
        stock_age_buckets: buildStockAgeBuckets(
          inventory_rows.map((row) => row.listing_age_days),
        ),
        quality_distribution: buildQualityDistribution(quality_scores),
        price_deviation: this.buildPriceDeviation(price_deviation_rows),
      },
      dealership,
      support: {
        phone: envs.WIAUTO_SUPPORT_PHONE,
        faq_url:
          envs.WIAUTO_FAQ_URL.trim() ||
          `${envs.FRONTEND_URL}/preguntas-frecuentes`,
      },
    };
  }

  private buildPriceDeviation(
    rows: Awaited<
      ReturnType<TypeOrmOwnerDashboardRepository["getPriceDeviationRows"]>
    >,
  ): OwnerDashboardPriceDeviation {
    const mapped: OwnerDashboardPriceDeviationItem[] = rows.map((row) => ({
      vehicle_id: row.vehicle_id,
      display_name: row.display_name,
      price: row.price,
      benchmark_price: row.benchmark_price,
      deviation_percent: row.deviation_percent,
    }));

    const above_market = mapped
      .filter((row) => row.deviation_percent > 5)
      .sort((a, b) => b.deviation_percent - a.deviation_percent)
      .slice(0, PRICE_DEVIATION_LIMIT);

    const below_market = mapped
      .filter((row) => row.deviation_percent < -5)
      .sort((a, b) => a.deviation_percent - b.deviation_percent)
      .slice(0, PRICE_DEVIATION_LIMIT);

    return {
      above_market,
      below_market,
    };
  }

  private async resolveDealership(
    profile_id: string,
  ): Promise<OwnerDashboardDealership | null> {
    const membership =
      await this.dealership_member_repository.findMembershipDetailByProfileId(
        profile_id,
      );

    if (!membership) {
      return null;
    }

    const dealership = await this.dealership_repository.findOne(
      membership.dealership_id,
    );

    if (!dealership) {
      return null;
    }

    const primitives = dealership.toPrimitives();
    const reviews_count =
      await this.owner_dashboard_repository.countDealershipReviews(
        primitives.id,
      );
    const should_hide_phone = primitives.show_phone === false;

    return {
      name: primitives.name,
      phone_code: should_hide_phone ? null : primitives.phone_code,
      phone: should_hide_phone ? null : primitives.phone,
      rating: primitives.rating,
      reviews_count,
    };
  }
}
