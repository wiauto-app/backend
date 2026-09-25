import { Inject, Logger } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { VehicleNotFoundException } from "../exceptions/vehicle-not-found.exception";
import {
  TypeOrmVehicleInsightsRepository,
  type VehicleHealthInputRow,
  type VehicleInsightsSubject,
  type VehicleSegmentBenchmarks,
} from "../repositories/typeorm.vehicle-insights-repository";
import type { ConditionVehicle, TransmissionType } from "../types/vehicle";
import {
  FUNNEL_METRIC_KEY,
  FUNNEL_TREND,
  SEGMENT_SCOPE,
  type FunnelMetric,
  type FunnelMetricKey,
  type FunnelTrend,
  type ListingFunnel,
  type OwnerListingHealthSummary,
  type PriceVerdict,
  type SegmentScope,
  type VehicleInsights,
} from "../types/vehicle-insights";
import { formatVehicleDisplayName } from "../utils/format-vehicle-display-name";
import {
  buildListingHealth,
  resolveFeaturedRecommendation,
  toOwnerListingHealthSummary,
} from "../utils/listing-health-rules";
import {
  canFeatureVehicle,
  isFeaturedActive,
} from "../utils/owner-vehicle-rules";
import {
  buildPriceInsight,
  computeDeviationPercent,
  resolvePriceVerdict,
  type PriceMarketInput,
} from "../utils/price-verdict-rules";
import {
  VehicleMarketStatsService,
  type VehicleMarketStatsResult,
} from "./vehicle-market-stats.service";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** Sin precio en la key: un cambio de precio reevalúa el veredicto contra el mismo mercado. */
export const MARKET_CACHE_TTL_MS = 6 * HOUR_MS;
export const MARKET_EMPTY_CACHE_TTL_MS = HOUR_MS;
export const SEGMENT_CACHE_TTL_MS = 6 * HOUR_MS;

export const FUNNEL_MIN_AGE_DAYS = 7;
export const FUNNEL_MAX_WINDOW_DAYS = 30;
export const SEGMENT_MIN_SAMPLE_COUNT = 10;
export const FUNNEL_TREND_ABOVE_RATIO = 1.2;
export const FUNNEL_TREND_BELOW_RATIO = 0.8;

interface EmptyCacheEntry {
  empty: true;
}

type CachedMarketEntry = VehicleMarketStatsResult | EmptyCacheEntry;

export interface MarketCacheKeyInput {
  vehicle_id: string;
  version_id: number;
  condition: ConditionVehicle;
  transmission_type: TransmissionType;
  mileage: number;
  lat: number;
  lng: number;
}

interface ResolvedSegment {
  benchmarks: VehicleSegmentBenchmarks;
  scope_label: string;
}

const is_empty_entry = (entry: CachedMarketEntry): entry is EmptyCacheEntry =>
  "empty" in entry && entry.empty;

export const buildMarketCacheKey = (input: MarketCacheKeyInput): string =>
  [
    "vehicle-insights:market:v1",
    input.vehicle_id,
    input.version_id,
    input.condition,
    input.transmission_type,
    input.mileage,
    Number(input.lat).toFixed(2),
    Number(input.lng).toFixed(2),
  ].join(":");

export const buildSegmentCacheKey = (params: {
  scope: SegmentScope;
  scope_id: number;
  window_days: number;
}): string =>
  `vehicle-insights:segment:v1:${params.scope}:${params.scope_id}:${params.window_days}`;

export const resolveFunnelTrend = (params: {
  daily_rate: number;
  segment_daily_rate: number | null;
}): FunnelTrend | null => {
  const { daily_rate, segment_daily_rate } = params;
  if (segment_daily_rate === null) {
    return null;
  }
  if (segment_daily_rate <= 0) {
    return daily_rate > 0 ? FUNNEL_TREND.ABOVE : FUNNEL_TREND.ON_PAR;
  }
  const ratio = daily_rate / segment_daily_rate;
  if (ratio > FUNNEL_TREND_ABOVE_RATIO) {
    return FUNNEL_TREND.ABOVE;
  }
  if (ratio < FUNNEL_TREND_BELOW_RATIO) {
    return FUNNEL_TREND.BELOW;
  }
  return FUNNEL_TREND.ON_PAR;
};

const round2 = (value: number): number => Math.round(value * 100) / 100;

const to_price_market = (
  stats: VehicleMarketStatsResult,
  scope_label: string,
): PriceMarketInput => ({
  p25: stats.range_min,
  median: stats.recommended_price,
  p75: stats.range_max,
  sample_count: stats.sample_count,
  tier: stats.tier,
  confidence: stats.confidence,
  scope_label,
});

const SEGMENT_RATE_BY_METRIC: Record<
  FunnelMetricKey,
  keyof Pick<
    VehicleSegmentBenchmarks,
    | "views_daily_rate"
    | "contact_clicks_daily_rate"
    | "leads_daily_rate"
    | "chats_daily_rate"
  >
> = {
  [FUNNEL_METRIC_KEY.VIEWS]: "views_daily_rate",
  [FUNNEL_METRIC_KEY.CONTACT_CLICKS]: "contact_clicks_daily_rate",
  [FUNNEL_METRIC_KEY.LEADS]: "leads_daily_rate",
  [FUNNEL_METRIC_KEY.CHATS]: "chats_daily_rate",
};

@Injectable()
export class VehicleInsightsService {
  private readonly logger = new Logger(VehicleInsightsService.name);

  constructor(
    private readonly insights_repository: TypeOrmVehicleInsightsRepository,
    private readonly market_stats_service: VehicleMarketStatsService,
    @Inject(CACHE_MANAGER) private readonly cache_manager: Cache,
  ) {}

  async getInsights(vehicle_id: string): Promise<VehicleInsights> {
    const now = new Date();
    const subject = await this.insights_repository.findSubject(vehicle_id, now);
    if (!subject) {
      throw new VehicleNotFoundException(vehicle_id);
    }

    const funnel_available = subject.listing_age_days >= FUNNEL_MIN_AGE_DAYS;
    const window_days = funnel_available
      ? Math.min(FUNNEL_MAX_WINDOW_DAYS, Math.floor(subject.listing_age_days))
      : 0;

    const [market_stats, segment, funnel_counts] = await Promise.all([
      this.getMarketStats(subject),
      this.getSegment(subject),
      funnel_available
        ? this.insights_repository.getFunnelCounts(
            subject.id,
            new Date(now.getTime() - window_days * DAY_MS),
          )
        : Promise.resolve(null),
    ]);

    const tier_scope_label =
      market_stats?.tier === 2
        ? subject.make_name
        : `${subject.make_name} ${subject.model_name}`;

    const price = buildPriceInsight({
      price: subject.price,
      market: market_stats
        ? to_price_market(market_stats, tier_scope_label.trim())
        : null,
      context: {
        make_name: subject.make_name,
        model_name: subject.model_name,
        year: subject.year,
        mileage: subject.mileage,
        condition: subject.condition,
        province: subject.address_details?.province ?? null,
      },
    });

    const health = buildListingHealth({
      photos_count: subject.images_count,
      description: subject.description,
      price: subject.price,
      price_verdict: price.verdict,
      price_deviation_percent: price.deviation_percent,
      mileage: subject.mileage,
      condition: subject.condition,
      color_id: subject.color_id,
      category_id: subject.category_id,
      dgt_label_id: subject.dgt_label_id,
      features_count: subject.features_count,
      segment_median_photos: segment?.benchmarks.median_photos ?? null,
    });

    const is_featured_active = isFeaturedActive({
      is_featured: subject.is_featured,
      featured_expires_at: subject.featured_expires_at,
      now,
    });
    const featured_recommendation = resolveFeaturedRecommendation({
      price_verdict: price.verdict,
      score: health.score,
    });

    return {
      vehicle_id: subject.id,
      status: subject.status,
      display_name: formatVehicleDisplayName({
        make_name: subject.make_name,
        model_name: subject.model_name,
        version_name: subject.version_name,
      }),
      featured: {
        is_active: is_featured_active,
        expires_at: subject.featured_expires_at,
        can_feature: canFeatureVehicle({
          status: subject.status,
          is_featured_active,
        }),
        recommendation: featured_recommendation.recommendation,
        recommendation_reason: featured_recommendation.reason,
      },
      price,
      health,
      funnel: this.buildFunnel({
        available: funnel_available,
        listing_age_days: subject.listing_age_days,
        window_days,
        counts: funnel_counts,
        segment,
      }),
      generated_at: now,
    };
  }

  /**
   * Lee las stats de mercado de un anuncio SOLO desde cache.
   * `undefined` = miss; `null` = cacheado como "sin comparables suficientes".
   */
  async readCachedMarketStats(
    input: MarketCacheKeyInput,
  ): Promise<VehicleMarketStatsResult | null | undefined> {
    try {
      const cached = await this.cache_manager.get<CachedMarketEntry>(
        buildMarketCacheKey(input),
      );
      if (!cached) {
        return undefined;
      }
      return is_empty_entry(cached) ? null : cached;
    } catch (error) {
      this.logger.warn(`Market cache read failed: ${String(error)}`);
      return undefined;
    }
  }

  /**
   * Health resumido para Mis Anuncios: 1 query batch + stats de mercado solo desde
   * cache (nunca calcula comparables). Miss → check de precio `unknown`.
   */
  async buildOwnerHealthSummaries(
    vehicle_ids: string[],
  ): Promise<Map<string, OwnerListingHealthSummary>> {
    const summaries = new Map<string, OwnerListingHealthSummary>();
    if (vehicle_ids.length === 0) {
      return summaries;
    }

    const rows =
      await this.insights_repository.findHealthInputsByVehicleIds(vehicle_ids);

    await Promise.all(
      rows.map(async (row) => {
        const market = await this.readCachedMarketStats({
          vehicle_id: row.id,
          version_id: row.version_id,
          condition: row.condition,
          transmission_type: row.transmission_type,
          mileage: row.mileage,
          lat: row.lat,
          lng: row.lng,
        });
        summaries.set(row.id, this.buildOwnerHealthSummary(row, market ?? null));
      }),
    );

    return summaries;
  }

  private buildOwnerHealthSummary(
    row: VehicleHealthInputRow,
    market: VehicleMarketStatsResult | null,
  ): OwnerListingHealthSummary {
    let price_verdict: PriceVerdict | null = null;
    let deviation: number | null = null;

    if (market && row.price > 0) {
      const price_market = to_price_market(market, "");
      price_verdict = resolvePriceVerdict(row.price, price_market);
      const raw_deviation = computeDeviationPercent(row.price, price_market.median);
      deviation =
        raw_deviation === null ? null : Math.round(raw_deviation * 10) / 10;
    }

    const health = buildListingHealth({
      photos_count: row.images_count,
      description: row.description,
      price: row.price,
      price_verdict,
      price_deviation_percent: deviation,
      mileage: row.mileage,
      condition: row.condition,
      color_id: row.color_id,
      category_id: row.category_id,
      dgt_label_id: row.dgt_label_id,
      features_count: row.features_count,
      segment_median_photos: null,
    });

    return toOwnerListingHealthSummary(health, price_verdict);
  }

  private async getMarketStats(
    subject: VehicleInsightsSubject,
  ): Promise<VehicleMarketStatsResult | null> {
    const key_input: MarketCacheKeyInput = {
      vehicle_id: subject.id,
      version_id: subject.version_id,
      condition: subject.condition,
      transmission_type: subject.transmission_type,
      mileage: subject.mileage,
      lat: subject.lat,
      lng: subject.lng,
    };

    const cached = await this.readCachedMarketStats(key_input);
    if (cached !== undefined) {
      return cached;
    }

    let stats: VehicleMarketStatsResult | null;
    try {
      stats = await this.market_stats_service.compute(
        {
          version_id: subject.version_id,
          condition: subject.condition,
          mileage: subject.mileage,
          transmission_type: subject.transmission_type,
          lat: subject.lat,
          lng: subject.lng,
        },
        { exclude_vehicle_ids: [subject.id] },
      );
    } catch (error) {
      this.logger.warn(
        `Market stats failed for vehicle ${subject.id}: ${String(error)}`,
      );
      return null;
    }

    const key = buildMarketCacheKey(key_input);
    try {
      if (stats) {
        await this.cache_manager.set(key, stats, MARKET_CACHE_TTL_MS);
      } else {
        const empty: EmptyCacheEntry = { empty: true };
        await this.cache_manager.set(key, empty, MARKET_EMPTY_CACHE_TTL_MS);
      }
    } catch (error) {
      this.logger.warn(`Market cache write failed: ${String(error)}`);
    }

    return stats;
  }

  /** Segmento modelo → marca (si < 10 anuncios). null si ninguno llega al mínimo. */
  private async getSegment(
    subject: VehicleInsightsSubject,
  ): Promise<ResolvedSegment | null> {
    try {
      const by_model = await this.getSegmentBenchmarks(
        SEGMENT_SCOPE.MODEL,
        subject.model_id,
      );
      if (by_model.sample_count >= SEGMENT_MIN_SAMPLE_COUNT) {
        return {
          benchmarks: by_model,
          scope_label: `${subject.make_name} ${subject.model_name}`.trim(),
        };
      }

      const by_make = await this.getSegmentBenchmarks(
        SEGMENT_SCOPE.MAKE,
        subject.make_id,
      );
      if (by_make.sample_count >= SEGMENT_MIN_SAMPLE_COUNT) {
        return { benchmarks: by_make, scope_label: subject.make_name };
      }
    } catch (error) {
      this.logger.warn(
        `Segment benchmarks failed for vehicle ${subject.id}: ${String(error)}`,
      );
    }
    return null;
  }

  /**
   * La ventana del segmento es siempre la máxima (tasas diarias, comparables con
   * cualquier ventana del anuncio) para tener una sola entrada de cache por scope.
   */
  private async getSegmentBenchmarks(
    scope: SegmentScope,
    scope_id: number,
  ): Promise<VehicleSegmentBenchmarks> {
    const window_days = FUNNEL_MAX_WINDOW_DAYS;
    const key = buildSegmentCacheKey({ scope, scope_id, window_days });

    const cached = await this.cache_manager.get<VehicleSegmentBenchmarks>(key);
    if (cached) {
      return cached;
    }

    const benchmarks = await this.insights_repository.getSegmentBenchmarks({
      scope,
      scope_id,
      window_days,
    });
    await this.cache_manager.set(key, benchmarks, SEGMENT_CACHE_TTL_MS);
    return benchmarks;
  }

  private buildFunnel(params: {
    available: boolean;
    listing_age_days: number;
    window_days: number;
    counts: Record<FunnelMetricKey, number> | null;
    segment: ResolvedSegment | null;
  }): ListingFunnel {
    const listing_age_days = Math.floor(params.listing_age_days);
    const { counts, segment } = params;

    if (!params.available || !counts || params.window_days <= 0) {
      return {
        available: false,
        min_age_days: FUNNEL_MIN_AGE_DAYS,
        listing_age_days,
        window_days: 0,
        metrics: [],
        segment: null,
      };
    }

    const metrics: FunnelMetric[] = Object.values(FUNNEL_METRIC_KEY).map(
      (key) => {
        const count = counts[key];
        const daily_rate = round2(count / params.window_days);
        const segment_daily_rate = segment
          ? round2(segment.benchmarks[SEGMENT_RATE_BY_METRIC[key]])
          : null;
        return {
          key,
          count,
          daily_rate,
          segment_daily_rate,
          trend: resolveFunnelTrend({ daily_rate, segment_daily_rate }),
        };
      },
    );

    return {
      available: true,
      min_age_days: FUNNEL_MIN_AGE_DAYS,
      listing_age_days,
      window_days: params.window_days,
      metrics,
      segment: segment
        ? {
            scope: segment.benchmarks.scope,
            scope_label: segment.scope_label,
            sample_count: segment.benchmarks.sample_count,
          }
        : null,
    };
  }
}
