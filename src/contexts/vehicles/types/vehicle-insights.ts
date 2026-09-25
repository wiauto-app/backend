import type { StatusVehicle } from "./vehicle";

export const PRICE_VERDICT = {
  SOSPECHOSAMENTE_BAJO: "sospechosamente_bajo",
  BAJO: "bajo",
  COMPETITIVO: "competitivo",
  ALTO: "alto",
  MUY_ALTO: "muy_alto",
} as const;

export type PriceVerdict = (typeof PRICE_VERDICT)[keyof typeof PRICE_VERDICT];

export const INSIGHT_CONFIDENCE = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
} as const;

export type InsightConfidence =
  (typeof INSIGHT_CONFIDENCE)[keyof typeof INSIGHT_CONFIDENCE];

export const CHECK_SEVERITY = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
} as const;

export type CheckSeverity = (typeof CHECK_SEVERITY)[keyof typeof CHECK_SEVERITY];

export const CHECK_STATUS = {
  PASS: "pass",
  WARN: "warn",
  FAIL: "fail",
  UNKNOWN: "unknown",
} as const;

export type CheckStatus = (typeof CHECK_STATUS)[keyof typeof CHECK_STATUS];

export const LISTING_EDIT_TARGET = {
  IMAGES: "images",
  DESCRIPTION: "description",
  PRICE: "price",
  MILEAGE: "mileage",
  COLOR: "color",
  CATEGORY: "category",
  DGT_LABEL: "dgt_label",
  EQUIPMENT: "equipment",
} as const;

export type ListingEditTarget =
  (typeof LISTING_EDIT_TARGET)[keyof typeof LISTING_EDIT_TARGET];

export const LISTING_CHECK_CODE = {
  PHOTOS_COUNT: "photos_count",
  DESCRIPTION_LENGTH: "description_length",
  PRICE_POSITION: "price_position",
  MISSING_PRICE: "missing_price",
  MISSING_MILEAGE: "missing_mileage",
  MISSING_COLOR: "missing_color",
  MISSING_CATEGORY: "missing_category",
  MISSING_DGT_LABEL: "missing_dgt_label",
  EQUIPMENT_COUNT: "equipment_count",
} as const;

export type ListingCheckCode =
  (typeof LISTING_CHECK_CODE)[keyof typeof LISTING_CHECK_CODE];

export const LISTING_HEALTH_TIER = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
} as const;

export type ListingHealthTier =
  (typeof LISTING_HEALTH_TIER)[keyof typeof LISTING_HEALTH_TIER];

export const FEATURED_RECOMMENDATION = {
  RECOMMENDED: "recommended",
  FIX_FIRST: "fix_first",
  NEUTRAL: "neutral",
} as const;

export type FeaturedRecommendation =
  (typeof FEATURED_RECOMMENDATION)[keyof typeof FEATURED_RECOMMENDATION];

export const MARKET_TIER = {
  SAME_MODEL: 1,
  SAME_MAKE: 2,
} as const;

export type MarketTier = (typeof MARKET_TIER)[keyof typeof MARKET_TIER];

export const FUNNEL_METRIC_KEY = {
  VIEWS: "views",
  CONTACT_CLICKS: "contact_clicks",
  LEADS: "leads",
  CHATS: "chats",
} as const;

export type FunnelMetricKey =
  (typeof FUNNEL_METRIC_KEY)[keyof typeof FUNNEL_METRIC_KEY];

export const FUNNEL_TREND = {
  ABOVE: "above",
  ON_PAR: "on_par",
  BELOW: "below",
} as const;

export type FunnelTrend = (typeof FUNNEL_TREND)[keyof typeof FUNNEL_TREND];

export const SEGMENT_SCOPE = {
  MODEL: "model",
  MAKE: "make",
} as const;

export type SegmentScope = (typeof SEGMENT_SCOPE)[keyof typeof SEGMENT_SCOPE];

export interface VehiclePriceMarket {
  p25: number;
  median: number;
  p75: number;
  sample_count: number;
  tier: MarketTier;
  /** Texto corto del segmento comparado, p.ej. "Toyota Hilux" o "Toyota". */
  scope_label: string;
}

export interface VehiclePriceInsight {
  price: number;
  currency: "EUR";
  market: VehiclePriceMarket | null;
  verdict: PriceVerdict | null;
  /** (precio - mediana) / mediana * 100, 1 decimal. */
  deviation_percent: number | null;
  /** Posición del precio en la barra [p25 - IQR, p75 + IQR], 0..100. */
  position_percent: number | null;
  /** Redondeado a 100 €. null si el precio es competitivo o no hay mercado. */
  suggested_price: number | null;
  confidence: InsightConfidence | null;
  summary: string | null;
  /** Reservado: requiere histórico de ventas (sold_at). */
  days_to_sell: null;
}

export interface ListingCheckCta {
  label: string;
  target: ListingEditTarget;
}

export type ListingCheckMeta = Record<string, string | number | boolean | null>;

export interface ListingCheck {
  code: ListingCheckCode;
  status: CheckStatus;
  /** null cuando el check pasa o es desconocido. */
  severity: CheckSeverity | null;
  weight: number;
  points: number;
  title: string;
  description: string;
  cta: ListingCheckCta | null;
  meta?: ListingCheckMeta;
}

export interface ListingHealth {
  score: number;
  tier: ListingHealthTier;
  checks: ListingCheck[];
  top_issue: ListingCheck | null;
  issues_count: number;
  /** Top 3 checks no aprobados, ordenados por severidad y puntos perdidos. */
  actions: ListingCheck[];
}

export interface FunnelMetric {
  key: FunnelMetricKey;
  count: number;
  /** Media diaria del anuncio en la ventana. */
  daily_rate: number;
  /** Mediana de la media diaria de anuncios del segmento. */
  segment_daily_rate: number | null;
  trend: FunnelTrend | null;
}

export interface ListingFunnelSegment {
  scope: SegmentScope;
  scope_label: string;
  sample_count: number;
}

export interface ListingFunnel {
  /** false si el anuncio tiene menos de `min_age_days` días. */
  available: boolean;
  min_age_days: number;
  listing_age_days: number;
  window_days: number;
  metrics: FunnelMetric[];
  segment: ListingFunnelSegment | null;
}

export interface VehicleInsightsFeatured {
  is_active: boolean;
  expires_at: Date | null;
  can_feature: boolean;
  recommendation: FeaturedRecommendation;
  recommendation_reason: string | null;
}

export interface VehicleInsights {
  vehicle_id: string;
  status: StatusVehicle;
  display_name: string;
  featured: VehicleInsightsFeatured;
  price: VehiclePriceInsight;
  health: ListingHealth;
  funnel: ListingFunnel;
  generated_at: Date;
}

export interface OwnerListingHealthSummary {
  score: number;
  tier: ListingHealthTier;
  top_issue: ListingCheck | null;
  issues_count: number;
  /** null si no hay stats de mercado en cache o no hay precio. */
  price_verdict: PriceVerdict | null;
}
