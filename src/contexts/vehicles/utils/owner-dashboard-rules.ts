import type {
  OwnerDashboardGranularity,
  OwnerDashboardQualityBucket,
  OwnerDashboardQualityTier,
  OwnerDashboardStockAgeBucket,
  OwnerDashboardSummary,
  OwnerDashboardSummaryRaw,
} from "../types/owner-dashboard";
import { buildStatTrend, isFeaturedActive } from "./owner-vehicle-rules";

export const OWNER_DASHBOARD_GRANULARITY_VALUES = [
  "day",
  "week",
  "month",
] as const;

export const DEFAULT_OWNER_DASHBOARD_RANGE_DAYS = 7;
export const OWNER_DASHBOARD_MAX_RANGE_DAYS = 366;

export const WEEKLY_ACTIVITY_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export interface OwnerDashboardDateRangeBounds {
  days: number;
  start: Date;
  end: Date;
  current_start: Date;
  previous_start: Date;
  period_end: Date;
  granularity: OwnerDashboardGranularity;
  start_date: string;
  end_date: string;
}

export class OwnerDashboardDateRangeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OwnerDashboardDateRangeError";
  }
}

const formatUtcDateOnly = (date: Date): string => {
  return date.toISOString().slice(0, 10);
};

const utcToday = (now: Date): Date => {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
};

const parseUtcDateOnly = (date_str: string): Date | null => {
  if (!DATE_ONLY_REGEX.test(date_str)) {
    return null;
  }

  const date = new Date(`${date_str}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || formatUtcDateOnly(date) !== date_str) {
    return null;
  }

  return date;
};

export const resolveOwnerDashboardGranularity = (
  days_inclusive: number,
): OwnerDashboardGranularity => {
  if (days_inclusive <= 15) {
    return "day";
  }

  if (days_inclusive <= 31) {
    return "week";
  }

  return "month";
};

export const resolveOwnerDashboardDateRangeBounds = (params: {
  start_date?: string;
  end_date?: string;
  now?: Date;
}): OwnerDashboardDateRangeBounds => {
  const now = params.now ?? new Date();
  const today = utcToday(now);

  let start_date_str = params.start_date;
  let end_date_str = params.end_date;

  const has_start = start_date_str !== undefined && start_date_str !== "";
  const has_end = end_date_str !== undefined && end_date_str !== "";

  if (has_start !== has_end) {
    throw new OwnerDashboardDateRangeError(
      "start_date y end_date deben enviarse juntos",
    );
  }

  if (!has_start && !has_end) {
    const end = today;
    const start = new Date(
      end.getTime() - (DEFAULT_OWNER_DASHBOARD_RANGE_DAYS - 1) * DAY_MS,
    );
    start_date_str = formatUtcDateOnly(start);
    end_date_str = formatUtcDateOnly(end);
  }

  const resolved_start_date = start_date_str ?? "";
  const resolved_end_date = end_date_str ?? "";
  const start = parseUtcDateOnly(resolved_start_date);
  const end_day = parseUtcDateOnly(resolved_end_date);

  if (!start || !end_day) {
    throw new OwnerDashboardDateRangeError(
      "start_date y end_date deben tener formato YYYY-MM-DD válido",
    );
  }

  if (start.getTime() > end_day.getTime()) {
    throw new OwnerDashboardDateRangeError(
      "start_date debe ser anterior o igual a end_date",
    );
  }

  const days =
    Math.floor((end_day.getTime() - start.getTime()) / DAY_MS) + 1;

  if (days > OWNER_DASHBOARD_MAX_RANGE_DAYS) {
    throw new OwnerDashboardDateRangeError(
      `El rango no puede superar ${OWNER_DASHBOARD_MAX_RANGE_DAYS} días`,
    );
  }

  const period_end = new Date(end_day.getTime() + DAY_MS);
  const previous_start = new Date(start.getTime() - days * DAY_MS);
  const end = new Date(period_end.getTime() - 1);
  const granularity = resolveOwnerDashboardGranularity(days);

  return {
    days,
    start,
    end,
    current_start: start,
    previous_start,
    period_end,
    granularity,
    start_date: resolved_start_date,
    end_date: resolved_end_date,
  };
};

export const buildOwnerDashboardSummary = (
  raw: OwnerDashboardSummaryRaw,
): OwnerDashboardSummary => ({
  active_stock: buildStatTrend(raw.active_stock_current, raw.active_stock_previous),
  views: buildStatTrend(raw.views_current, raw.views_previous),
  leads: buildStatTrend(raw.leads_current, raw.leads_previous),
  sales_value: buildStatTrend(raw.sales_value_current, raw.sales_value_previous),
});

const STOCK_AGE_BUCKET_DEFINITIONS = [
  { key: "lt_30", label: "Menos de 30 días" },
  { key: "30_59", label: "De 30 a 59 días" },
  { key: "60_89", label: "De 60 a 89 días" },
  { key: "gte_90", label: "Más de 90 días" },
] as const;

export const resolveStockAgeBucketKey = (listing_age_days: number): string => {
  if (listing_age_days < 30) {
    return "lt_30";
  }
  if (listing_age_days < 60) {
    return "30_59";
  }
  if (listing_age_days < 90) {
    return "60_89";
  }
  return "gte_90";
};

export const buildStockAgeBuckets = (
  listing_age_days_list: number[],
): OwnerDashboardStockAgeBucket[] => {
  const counts = new Map<string, number>(
    STOCK_AGE_BUCKET_DEFINITIONS.map((bucket) => [bucket.key, 0]),
  );

  for (const listing_age_days of listing_age_days_list) {
    const key = resolveStockAgeBucketKey(listing_age_days);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const total = listing_age_days_list.length;

  return STOCK_AGE_BUCKET_DEFINITIONS.map((bucket) => {
    const count = counts.get(bucket.key) ?? 0;
    const percentage =
      total === 0 ? 0 : Math.round((count / total) * 1000) / 10;

    return {
      label: bucket.label,
      count,
      percentage,
    };
  });
};

export const calculateListingQualityScore = (params: {
  image_count: number;
  description_length: number;
  price: number;
  mileage: number;
  is_featured: boolean;
  featured_expires_at: Date | null;
  now?: Date;
}): number => {
  const image_score = Math.min(25, params.image_count * 5);
  const description_score = Math.min(
    20,
    Math.floor((params.description_length / 150) * 20),
  );
  const price_score = params.price > 0 ? 20 : 0;
  const mileage_score = params.mileage > 0 ? 15 : 0;
  const featured_score = isFeaturedActive({
    is_featured: params.is_featured,
    featured_expires_at: params.featured_expires_at,
    now: params.now,
  })
    ? 20
    : 0;

  return Math.min(
    100,
    image_score + description_score + price_score + mileage_score + featured_score,
  );
};

export const resolveQualityTier = (
  score: number,
): OwnerDashboardQualityTier => {
  if (score >= 75) {
    return "high";
  }
  if (score >= 50) {
    return "medium";
  }
  return "low";
};

const QUALITY_TIER_LABELS: Record<OwnerDashboardQualityTier, string> = {
  high: "Calidad alta",
  medium: "Calidad media",
  low: "Calidad baja",
};

export const buildQualityDistribution = (
  scores: number[],
): OwnerDashboardQualityBucket[] => {
  const counts: Record<OwnerDashboardQualityTier, number> = {
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const score of scores) {
    const tier = resolveQualityTier(score);
    counts[tier] += 1;
  }

  return (["high", "medium", "low"] as const).map((tier) => ({
    tier,
    label: QUALITY_TIER_LABELS[tier],
    count: counts[tier],
  }));
};
