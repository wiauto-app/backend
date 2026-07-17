import type {
  OwnerDashboardPeriodCode,
  OwnerDashboardQualityBucket,
  OwnerDashboardQualityTier,
  OwnerDashboardStockAgeBucket,
  OwnerDashboardSummary,
  OwnerDashboardSummaryRaw,
} from "../types/owner-dashboard";
import { buildStatTrend, isFeaturedActive } from "./owner-vehicle-rules";

export const OWNER_DASHBOARD_PERIOD_CODES = ["7d", "30d", "90d"] as const;

export const OWNER_DASHBOARD_PERIOD_DAYS: Record<OwnerDashboardPeriodCode, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export const DEFAULT_OWNER_DASHBOARD_PERIOD: OwnerDashboardPeriodCode = "30d";

export const WEEKLY_ACTIVITY_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface OwnerDashboardPeriodBounds {
  days: number;
  start: Date;
  end: Date;
  current_start: Date;
  previous_start: Date;
}

export const resolveOwnerDashboardPeriodBounds = (
  period: OwnerDashboardPeriodCode,
  now: Date = new Date(),
): OwnerDashboardPeriodBounds => {
  const days = OWNER_DASHBOARD_PERIOD_DAYS[period];
  const period_ms = days * DAY_MS;
  const end = now;
  const start = new Date(now.getTime() - period_ms);
  const current_start = start;
  const previous_start = new Date(now.getTime() - period_ms * 2);

  return {
    days,
    start,
    end,
    current_start,
    previous_start,
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
