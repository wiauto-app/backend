import {
  CONDITION_VEHICLE,
  type ConditionVehicle,
} from "../types/vehicle";
import {
  INSIGHT_CONFIDENCE,
  MARKET_TIER,
  PRICE_VERDICT,
  type InsightConfidence,
  type MarketTier,
  type PriceVerdict,
  type VehiclePriceInsight,
  type VehiclePriceMarket,
} from "../types/vehicle-insights";

/** El IQR nunca baja del 3% de la mediana (mercados con precios casi idénticos). */
export const PRICE_IQR_MIN_MEDIAN_RATIO = 0.03;
/** Por debajo de p25 - 1.5·IQR el precio es sospechosamente bajo. */
export const PRICE_SUSPICIOUS_IQR_FACTOR = 1.5;
/** Desviación (%) bajo la mediana que se considera sospechosa. */
export const PRICE_SUSPICIOUS_DEVIATION_PERCENT = -30;
/** Desviación (%) máxima sobre la mediana para seguir siendo "alto". */
export const PRICE_HIGH_MAX_DEVIATION_PERCENT = 20;
export const SUGGESTED_PRICE_ROUNDING = 100;

export interface PriceMarketInput {
  p25: number;
  median: number;
  p75: number;
  sample_count: number;
  tier: MarketTier;
  confidence: InsightConfidence;
  scope_label: string;
}

export interface PriceSummaryContext {
  make_name: string | null;
  model_name: string | null;
  year: number | null;
  mileage: number;
  condition: ConditionVehicle;
  province: string | null;
}

const round_to = (value: number, decimals: number): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const computePriceIqr = (market: {
  p25: number;
  median: number;
  p75: number;
}): number =>
  Math.max(market.p75 - market.p25, PRICE_IQR_MIN_MEDIAN_RATIO * market.median);

export const computeDeviationPercent = (
  price: number,
  median: number,
): number | null => {
  if (median <= 0) {
    return null;
  }
  return ((price - median) / median) * 100;
};

export const resolvePriceVerdict = (
  price: number,
  market: { p25: number; median: number; p75: number },
): PriceVerdict | null => {
  if (price <= 0 || market.median <= 0) {
    return null;
  }

  const iqr = computePriceIqr(market);
  const deviation = computeDeviationPercent(price, market.median) ?? 0;

  if (
    price < market.p25 - PRICE_SUSPICIOUS_IQR_FACTOR * iqr ||
    deviation < PRICE_SUSPICIOUS_DEVIATION_PERCENT
  ) {
    return PRICE_VERDICT.SOSPECHOSAMENTE_BAJO;
  }
  if (price < market.p25) {
    return PRICE_VERDICT.BAJO;
  }
  if (price <= market.p75) {
    return PRICE_VERDICT.COMPETITIVO;
  }
  if (
    price <= market.p75 + iqr &&
    deviation <= PRICE_HIGH_MAX_DEVIATION_PERCENT
  ) {
    return PRICE_VERDICT.ALTO;
  }
  return PRICE_VERDICT.MUY_ALTO;
};

/** Posición del precio en la barra [p25 - IQR, p75 + IQR], 0..100 (entero). */
export const computePositionPercent = (
  price: number,
  market: { p25: number; median: number; p75: number },
): number => {
  const iqr = computePriceIqr(market);
  const lower = market.p25 - iqr;
  const upper = market.p75 + iqr;
  const span = upper - lower;
  if (span <= 0) {
    return 50;
  }
  return Math.round(clamp(((price - lower) / span) * 100, 0, 100));
};

export const roundSuggestedPrice = (value: number): number =>
  Math.round(value / SUGGESTED_PRICE_ROUNDING) * SUGGESTED_PRICE_ROUNDING;

export const resolveSuggestedPrice = (
  verdict: PriceVerdict | null,
  market: { p25: number; median: number },
): number | null => {
  switch (verdict) {
    case PRICE_VERDICT.ALTO:
    case PRICE_VERDICT.MUY_ALTO: {
      return roundSuggestedPrice(market.median);
    }
    case PRICE_VERDICT.BAJO:
    case PRICE_VERDICT.SOSPECHOSAMENTE_BAJO: {
      return roundSuggestedPrice(market.p25);
    }
    default: {
      return null;
    }
  }
};

/** El tier 2 (misma marca) compara peor: se limita la confianza a "medium". */
export const resolvePriceConfidence = (
  confidence: InsightConfidence,
  tier: MarketTier,
): InsightConfidence => {
  if (tier === MARKET_TIER.SAME_MAKE && confidence === INSIGHT_CONFIDENCE.HIGH) {
    return INSIGHT_CONFIDENCE.MEDIUM;
  }
  return confidence;
};

export const formatThousands = (value: number): string =>
  Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");

const build_vehicle_label = (context: PriceSummaryContext): string => {
  const parts = [context.make_name, context.model_name]
    .map((part) => part?.trim())
    .filter(Boolean);
  if (context.year) {
    parts.push(String(context.year));
  }
  const name = parts.join(" ") || "vehículo";
  const is_used = context.condition === CONDITION_VEHICLE.USED;
  if (is_used && context.mileage > 0) {
    return `${name} con ${formatThousands(context.mileage)} km`;
  }
  return name;
};

export const buildPriceSummary = (params: {
  verdict: PriceVerdict;
  deviation_percent: number;
  market: { sample_count: number; tier: MarketTier };
  context: PriceSummaryContext;
}): string => {
  const { verdict, deviation_percent, market, context } = params;
  const vehicle_label = build_vehicle_label(context);
  const noun = market.sample_count === 1 ? "anuncio similar" : "anuncios similares";
  const scope_suffix =
    market.tier === MARKET_TIER.SAME_MAKE ? " de la misma marca" : "";
  const province = context.province?.trim();
  const location_suffix = province ? ` en ${province}` : "";
  const segment = `${market.sample_count} ${noun}${scope_suffix}${location_suffix}`;

  if (verdict === PRICE_VERDICT.COMPETITIVO) {
    return `Tu ${vehicle_label} está dentro del rango de mercado de ${segment}.`;
  }

  const abs_deviation = Math.round(Math.abs(deviation_percent));
  if (abs_deviation === 0) {
    return `Tu ${vehicle_label} está en línea con la mediana de ${segment}.`;
  }

  const direction = deviation_percent > 0 ? "sobre" : "bajo";
  return `Tu ${vehicle_label} está ${abs_deviation}% ${direction} la mediana de ${segment}.`;
};

const empty_price_insight = (price: number): VehiclePriceInsight => ({
  price,
  currency: "EUR",
  market: null,
  verdict: null,
  deviation_percent: null,
  position_percent: null,
  suggested_price: null,
  confidence: null,
  summary: null,
  days_to_sell: null,
});

export const buildPriceInsight = (params: {
  price: number;
  market: PriceMarketInput | null;
  context: PriceSummaryContext;
}): VehiclePriceInsight => {
  const { price, market, context } = params;
  if (!market) {
    return empty_price_insight(price);
  }

  const market_view: VehiclePriceMarket = {
    p25: market.p25,
    median: market.median,
    p75: market.p75,
    sample_count: market.sample_count,
    tier: market.tier,
    scope_label: market.scope_label,
  };
  const confidence = resolvePriceConfidence(market.confidence, market.tier);
  const verdict = resolvePriceVerdict(price, market);
  const deviation = computeDeviationPercent(price, market.median);

  if (!verdict || deviation === null) {
    return {
      ...empty_price_insight(price),
      market: market_view,
      confidence,
    };
  }

  return {
    price,
    currency: "EUR",
    market: market_view,
    verdict,
    deviation_percent: round_to(deviation, 1),
    position_percent: computePositionPercent(price, market),
    suggested_price: resolveSuggestedPrice(verdict, market),
    confidence,
    summary: buildPriceSummary({
      verdict,
      deviation_percent: deviation,
      market,
      context,
    }),
    days_to_sell: null,
  };
};
