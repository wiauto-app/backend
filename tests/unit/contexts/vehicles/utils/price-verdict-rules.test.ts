import { describe, expect, it } from "vitest";

import {
  buildPriceInsight,
  computePositionPercent,
  computePriceIqr,
  formatThousands,
  resolvePriceConfidence,
  resolvePriceVerdict,
  resolveSuggestedPrice,
  roundSuggestedPrice,
  type PriceMarketInput,
  type PriceSummaryContext,
} from "@/src/contexts/vehicles/utils/price-verdict-rules";

const market = (overrides: Partial<PriceMarketInput> = {}): PriceMarketInput => ({
  p25: 10_000,
  median: 12_000,
  p75: 14_000,
  sample_count: 18,
  tier: 1,
  confidence: "high",
  scope_label: "Toyota Hilux",
  ...overrides,
});

const context = (
  overrides: Partial<PriceSummaryContext> = {},
): PriceSummaryContext => ({
  make_name: "Toyota",
  model_name: "Hilux",
  year: 2019,
  mileage: 80_000,
  condition: "used",
  province: "Pichincha",
  ...overrides,
});

describe("computePriceIqr", () => {
  it("uses p75 - p25 when above the floor", () => {
    expect(computePriceIqr(market())).toBe(4000);
  });

  it("floors the IQR at 3% of the median", () => {
    expect(
      computePriceIqr({ p25: 10_000, median: 10_000, p75: 10_000 }),
    ).toBe(300);
  });
});

describe("resolvePriceVerdict", () => {
  it("returns null for price 0", () => {
    expect(resolvePriceVerdict(0, market())).toBeNull();
  });

  it("treats p25 and p75 as competitivo (inclusive)", () => {
    expect(resolvePriceVerdict(10_000, market())).toBe("competitivo");
    expect(resolvePriceVerdict(14_000, market())).toBe("competitivo");
  });

  it("marks just below p25 as bajo and just above p75 as alto", () => {
    expect(resolvePriceVerdict(9999, market())).toBe("bajo");
    expect(resolvePriceVerdict(14_001, market())).toBe("alto");
  });

  it("uses the -30% deviation boundary for sospechosamente_bajo", () => {
    // median 12000 → -30% = 8400; p25 - 1.5·IQR = 4000 (not binding)
    expect(resolvePriceVerdict(8400, market())).toBe("bajo");
    expect(resolvePriceVerdict(8399, market())).toBe("sospechosamente_bajo");
  });

  it("uses p25 - 1.5·IQR for sospechosamente_bajo", () => {
    const tight = market({ p25: 10_000, median: 10_500, p75: 11_000 });
    // IQR 1000 → threshold 8500; -30% → 7350 (not binding)
    expect(resolvePriceVerdict(8500, tight)).toBe("bajo");
    expect(resolvePriceVerdict(8499, tight)).toBe("sospechosamente_bajo");
  });

  it("uses p75 + IQR as upper bound of alto", () => {
    const m = market({ p25: 19_000, median: 20_000, p75: 21_000 });
    // IQR 2000 → p75 + IQR = 23000 (+15%)
    expect(resolvePriceVerdict(23_000, m)).toBe("alto");
    expect(resolvePriceVerdict(23_001, m)).toBe("muy_alto");
  });

  it("uses +20% deviation as upper bound of alto", () => {
    const m = market({ p25: 18_000, median: 20_000, p75: 22_000 });
    // p75 + IQR = 26000 (not binding); +20% = 24000
    expect(resolvePriceVerdict(24_000, m)).toBe("alto");
    expect(resolvePriceVerdict(24_001, m)).toBe("muy_alto");
  });

  it("applies the IQR floor when all comparables share a price", () => {
    const flat = market({ p25: 10_000, median: 10_000, p75: 10_000 });
    expect(resolvePriceVerdict(10_000, flat)).toBe("competitivo");
    expect(resolvePriceVerdict(10_300, flat)).toBe("alto");
    expect(resolvePriceVerdict(10_301, flat)).toBe("muy_alto");
    expect(resolvePriceVerdict(9999, flat)).toBe("bajo");
    expect(resolvePriceVerdict(9549, flat)).toBe("sospechosamente_bajo");
  });
});

describe("computePositionPercent", () => {
  it("maps the bar [p25 - IQR, p75 + IQR] to 0..100 and clamps", () => {
    expect(computePositionPercent(6000, market())).toBe(0);
    expect(computePositionPercent(18_000, market())).toBe(100);
    expect(computePositionPercent(12_000, market())).toBe(50);
    expect(computePositionPercent(1000, market())).toBe(0);
    expect(computePositionPercent(90_000, market())).toBe(100);
  });
});

describe("suggested price", () => {
  it("rounds to the nearest 100", () => {
    expect(roundSuggestedPrice(12_345)).toBe(12_300);
    expect(roundSuggestedPrice(12_350)).toBe(12_400);
  });

  it("suggests median for alto/muy_alto, p25 for bajo/sospechoso, null for competitivo", () => {
    const m = { p25: 10_049, median: 12_351 };
    expect(resolveSuggestedPrice("alto", m)).toBe(12_400);
    expect(resolveSuggestedPrice("muy_alto", m)).toBe(12_400);
    expect(resolveSuggestedPrice("bajo", m)).toBe(10_000);
    expect(resolveSuggestedPrice("sospechosamente_bajo", m)).toBe(10_000);
    expect(resolveSuggestedPrice("competitivo", m)).toBeNull();
    expect(resolveSuggestedPrice(null, m)).toBeNull();
  });
});

describe("resolvePriceConfidence", () => {
  it("caps tier 2 at medium", () => {
    expect(resolvePriceConfidence("high", 2)).toBe("medium");
    expect(resolvePriceConfidence("low", 2)).toBe("low");
    expect(resolvePriceConfidence("high", 1)).toBe("high");
  });
});

describe("formatThousands", () => {
  it("uses dots as thousands separator", () => {
    expect(formatThousands(80_000)).toBe("80.000");
    expect(formatThousands(1_234_567)).toBe("1.234.567");
    expect(formatThousands(950)).toBe("950");
  });
});

describe("buildPriceInsight", () => {
  it("returns an empty insight without market", () => {
    const insight = buildPriceInsight({
      price: 15_000,
      market: null,
      context: context(),
    });
    expect(insight).toMatchObject({
      price: 15_000,
      currency: "EUR",
      market: null,
      verdict: null,
      summary: null,
      suggested_price: null,
      days_to_sell: null,
    });
  });

  it("returns market but no verdict when price is 0", () => {
    const insight = buildPriceInsight({
      price: 0,
      market: market(),
      context: context(),
    });
    expect(insight.verdict).toBeNull();
    expect(insight.market?.median).toBe(12_000);
    expect(insight.summary).toBeNull();
  });

  it("builds the deterministic summary for alto", () => {
    const insight = buildPriceInsight({
      price: 13_440,
      market: market({ p25: 10_000, median: 12_000, p75: 13_000 }),
      context: context(),
    });
    expect(insight.verdict).toBe("alto");
    expect(insight.deviation_percent).toBe(12);
    expect(insight.suggested_price).toBe(12_000);
    expect(insight.summary).toBe(
      "Tu Toyota Hilux 2019 con 80.000 km está 12% sobre la mediana de 18 anuncios similares en Pichincha.",
    );
  });

  it("uses 'de la misma marca' for tier 2, omits province when absent and caps confidence", () => {
    const insight = buildPriceInsight({
      price: 9000,
      market: market({ tier: 2 }),
      context: context({ province: null }),
    });
    expect(insight.verdict).toBe("bajo");
    expect(insight.confidence).toBe("medium");
    expect(insight.summary).toBe(
      "Tu Toyota Hilux 2019 con 80.000 km está 25% bajo la mediana de 18 anuncios similares de la misma marca.",
    );
  });

  it("uses the market range copy for competitivo and skips mileage for new cars", () => {
    const insight = buildPriceInsight({
      price: 12_500,
      market: market(),
      context: context({ condition: "new", mileage: 0 }),
    });
    expect(insight.verdict).toBe("competitivo");
    expect(insight.suggested_price).toBeNull();
    expect(insight.summary).toBe(
      "Tu Toyota Hilux 2019 está dentro del rango de mercado de 18 anuncios similares en Pichincha.",
    );
  });
});
