import { BadRequestException } from "@nestjs/common";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { TypeOrmOwnerStatisticsRepository } from "../repositories/typeorm.owner-statistics-repository";
import type {
  OwnerStatisticsGranularity,
  OwnerStatisticsResult,
} from "../types/owner-statistics";
import {
  OwnerStatisticsDateRangeError,
  resolveOwnerStatisticsDateRangeBounds,
} from "../utils/owner-statistics-rules";

export interface GetOwnerStatisticsDto {
  profile_id: string;
  since: string;
  until?: string;
  granularity?: OwnerStatisticsGranularity;
}

@Injectable()
export class OwnerStatisticsService {
  constructor(
    private readonly owner_statistics_repository: TypeOrmOwnerStatisticsRepository,
  ) {}

  async getStatistics(
    dto: GetOwnerStatisticsDto,
  ): Promise<OwnerStatisticsResult> {
    let bounds;

    try {
      bounds = resolveOwnerStatisticsDateRangeBounds({
        since: dto.since,
        until: dto.until,
        granularity: dto.granularity,
      });
    } catch (error) {
      if (error instanceof OwnerStatisticsDateRangeError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }

    const [reach_counts, response_rate, time_series] = await Promise.all([
      this.owner_statistics_repository.getReachCounts({
        profile_id: dto.profile_id,
        period_start: bounds.period_start,
        period_end: bounds.period_end,
      }),
      this.owner_statistics_repository.getResponseRateStats({
        profile_id: dto.profile_id,
        period_start: bounds.period_start,
        period_end: bounds.period_end,
      }),
      this.owner_statistics_repository.getTimeSeries({
        profile_id: dto.profile_id,
        period_start: bounds.period_start,
        period_end: bounds.period_end,
        granularity: bounds.granularity,
        step_interval: bounds.step_interval,
      }),
    ]);

    const contacts =
      reach_counts.leads +
      reach_counts.contact_clicks +
      response_rate.chats_with_incoming;

    const response_rate_percent =
      response_rate.chats_with_incoming === 0
        ? null
        : Math.round(
            (response_rate.chats_with_response /
              response_rate.chats_with_incoming) *
              1000,
          ) / 10;

    return {
      period: {
        since: bounds.since,
        until: bounds.until,
        granularity: bounds.granularity,
      },
      reach: {
        listings_published: reach_counts.listings_published,
        impressions: reach_counts.impressions,
        visits: reach_counts.visits,
        contacts,
      },
      actions: {
        favorites: reach_counts.favorites,
        shares: reach_counts.shares,
        response_rate_percent,
        median_response_time_minutes: response_rate.median_response_minutes,
      },
      time_series,
    };
  }
}
