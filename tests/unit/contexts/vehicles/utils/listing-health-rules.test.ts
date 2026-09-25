import { describe, expect, it } from "vitest";

import {
  LISTING_HEALTH_MAX_ACTIONS,
  LISTING_HEALTH_RULES_VERSION,
  buildListingHealth,
  computeListingScore,
  resolveFeaturedRecommendation,
  toOwnerListingHealthSummary,
  type ListingHealthInput,
} from "@/src/contexts/vehicles/utils/listing-health-rules";

const perfect_input = (
  overrides: Partial<ListingHealthInput> = {},
): ListingHealthInput => ({
  photos_count: 10,
  description: "x".repeat(320),
  price: 15_000,
  price_verdict: "competitivo",
  price_deviation_percent: 2,
  mileage: 80_000,
  condition: "used",
  color_id: "color",
  category_id: "category",
  dgt_label_id: "dgt",
  features_count: 5,
  segment_median_photos: 11,
  ...overrides,
});

const find_check = (
  input: ListingHealthInput,
  code: string,
) => buildListingHealth(input).checks.find((check) => check.code === code);

const points = (verdict: ListingHealthInput["price_verdict"]) =>
  find_check(perfect_input({ price_verdict: verdict }), "price_position");

describe("listing health rules", () => {
  it("exposes the rules version", () => {
    expect(LISTING_HEALTH_RULES_VERSION).toBe(1);
  });

  it("scores a complete listing with 100 and no issues", () => {
    const health = buildListingHealth(perfect_input());
    expect(health.score).toBe(100);
    expect(health.tier).toBe("high");
    expect(health.issues_count).toBe(0);
    expect(health.top_issue).toBeNull();
    expect(health.actions).toEqual([]);
    expect(health.checks).toHaveLength(8);
  });

  it("normalizes the score excluding the unknown price check (no market)", () => {
    const input = perfect_input({
      photos_count: 4,
      description: "",
      price_verdict: null,
      price_deviation_percent: null,
      color_id: null,
      features_count: 0,
    });
    const health = buildListingHealth(input);
    // points: photos 10 + desc 0 + mileage 7 + color 0 + category 5 + dgt 3 + equip 0 = 25
    // known weights: 100 - 25 (price unknown) = 75 → 33
    expect(health.score).toBe(33);
    expect(health.tier).toBe("low");
    const price = health.checks.find((c) => c.code === "price_position");
    expect(price?.status).toBe("unknown");
    expect(price?.severity).toBeNull();
    expect(computeListingScore(health.checks)).toBe(33);
  });

  it("includes the price check in the score when there is market", () => {
    const health = buildListingHealth(
      perfect_input({
        photos_count: 4,
        description: "",
        price_verdict: "alto",
        price_deviation_percent: 15,
        color_id: null,
        features_count: 0,
      }),
    );
    // 25 + alto 12 = 37 over 100
    expect(health.score).toBe(37);
  });

  it("orders issues by severity then lost points and caps actions at 3", () => {
    const health = buildListingHealth(
      perfect_input({
        photos_count: 4, // warn/high, lost 20
        description: "", // fail/high, lost 20
        price_verdict: "alto", // warn/high, lost 13
        price_deviation_percent: 15,
        color_id: null, // fail/medium
        features_count: 0, // warn/low
      }),
    );
    expect(health.issues_count).toBe(5);
    expect(health.top_issue?.code).toBe("photos_count");
    expect(health.actions).toHaveLength(LISTING_HEALTH_MAX_ACTIONS);
    expect(health.actions.map((a) => a.code)).toEqual([
      "photos_count",
      "description_length",
      "price_position",
    ]);
  });

  it("puts critical issues first, breaking ties by lost points", () => {
    const health = buildListingHealth(
      perfect_input({
        photos_count: 2, // fail/critical, lost 30
        price_verdict: "muy_alto", // fail/critical, lost 25
        price_deviation_percent: 40,
        dgt_label_id: null, // fail/low
      }),
    );
    expect(health.actions.map((a) => a.code)).toEqual([
      "photos_count",
      "price_position",
      "missing_dgt_label",
    ]);
  });

  it("uses lost points to rank within the same severity", () => {
    const health = buildListingHealth(
      perfect_input({
        description: "short", // warn/medium, lost 15
        photos_count: 6, // warn/medium, lost 10
        color_id: null, // fail/medium, lost 5
      }),
    );
    expect(health.actions.map((a) => a.code)).toEqual([
      "description_length",
      "photos_count",
      "missing_color",
    ]);
  });

  it("grades photos by count", () => {
    expect(find_check(perfect_input({ photos_count: 8 }), "photos_count")).toMatchObject({ status: "pass", points: 30 });
    expect(find_check(perfect_input({ photos_count: 7 }), "photos_count")).toMatchObject({ status: "warn", severity: "medium", points: 20 });
    expect(find_check(perfect_input({ photos_count: 5 }), "photos_count")).toMatchObject({ status: "warn", severity: "medium", points: 20 });
    expect(find_check(perfect_input({ photos_count: 4 }), "photos_count")).toMatchObject({ status: "warn", severity: "high", points: 10 });
    expect(find_check(perfect_input({ photos_count: 3 }), "photos_count")).toMatchObject({ status: "warn", severity: "high", points: 10 });
    expect(find_check(perfect_input({ photos_count: 2 }), "photos_count")).toMatchObject({ status: "fail", severity: "critical", points: 0 });
  });

  it("uses the segment photo median in the photos copy", () => {
    const check = find_check(
      perfect_input({ photos_count: 4, segment_median_photos: 11 }),
      "photos_count",
    );
    expect(check?.description).toContain(
      "Los anuncios similares tienen 11 fotos; tú tienes 4.",
    );
    expect(check?.cta).toEqual({ label: "Añadir fotos", target: "images" });
    expect(check?.meta).toEqual({ photos_count: 4, segment_median_photos: 11 });
  });

  it("grades the trimmed description length", () => {
    expect(find_check(perfect_input({ description: `  ${"a".repeat(300)}  ` }), "description_length")).toMatchObject({ status: "pass", points: 20 });
    expect(find_check(perfect_input({ description: "a".repeat(299) }), "description_length")).toMatchObject({ status: "warn", severity: "low", points: 12 });
    expect(find_check(perfect_input({ description: "a".repeat(120) }), "description_length")).toMatchObject({ status: "warn", severity: "low", points: 12 });
    expect(find_check(perfect_input({ description: "a".repeat(119) }), "description_length")).toMatchObject({ status: "warn", severity: "medium", points: 5 });
    expect(find_check(perfect_input({ description: "   " }), "description_length")).toMatchObject({ status: "fail", severity: "high", points: 0 });
    expect(find_check(perfect_input({ description: null }), "description_length")).toMatchObject({ status: "fail", points: 0 });
  });

  it("maps price verdicts to points", () => {
    expect(points("competitivo")).toMatchObject({ status: "pass", points: 25 });
    expect(points("bajo")).toMatchObject({ status: "warn", severity: "low", points: 20 });
    expect(points("alto")).toMatchObject({ status: "warn", severity: "high", points: 12 });
    expect(points("sospechosamente_bajo")).toMatchObject({ status: "fail", severity: "critical", points: 5 });
    expect(points("muy_alto")).toMatchObject({ status: "fail", severity: "critical", points: 0 });
  });

  it("emits missing_price (fail/critical) when price is 0", () => {
    const health = buildListingHealth(
      perfect_input({ price: 0, price_verdict: null }),
    );
    const check = health.checks.find((c) => c.code === "missing_price");
    expect(check).toMatchObject({
      status: "fail",
      severity: "critical",
      weight: 25,
      points: 0,
    });
    expect(health.top_issue?.code).toBe("missing_price");
    expect(health.score).toBe(75);
  });

  it("requires mileage only for used vehicles", () => {
    expect(find_check(perfect_input({ mileage: 0, condition: "used" }), "missing_mileage")).toMatchObject({ status: "fail", severity: "high" });
    expect(find_check(perfect_input({ mileage: 0, condition: "new" }), "missing_mileage")).toMatchObject({ status: "pass" });
    expect(find_check(perfect_input({ mileage: 0, condition: "0KM" }), "missing_mileage")).toMatchObject({ status: "pass" });
  });

  it("grades equipment count", () => {
    expect(find_check(perfect_input({ features_count: 3 }), "equipment_count")).toMatchObject({ status: "pass", points: 5 });
    expect(find_check(perfect_input({ features_count: 2 }), "equipment_count")).toMatchObject({ status: "warn", severity: "low", points: 2 });
    expect(find_check(perfect_input({ features_count: 0 }), "equipment_count")).toMatchObject({ status: "warn", points: 0 });
  });

  it("builds the owner summary", () => {
    const health = buildListingHealth(perfect_input({ color_id: null }));
    expect(toOwnerListingHealthSummary(health, "competitivo")).toEqual({
      score: 95,
      tier: "high",
      top_issue: health.top_issue,
      issues_count: 1,
      price_verdict: "competitivo",
    });
  });
});

describe("resolveFeaturedRecommendation", () => {
  it("asks to fix the price first when alto/muy_alto", () => {
    const result = resolveFeaturedRecommendation({ price_verdict: "alto", score: 90 });
    expect(result.recommendation).toBe("fix_first");
    expect(result.reason).toContain("Ajusta el precio antes de destacar");
    expect(resolveFeaturedRecommendation({ price_verdict: "muy_alto", score: 90 }).recommendation).toBe("fix_first");
  });

  it("asks to improve quality first when score < 50", () => {
    const result = resolveFeaturedRecommendation({ price_verdict: "competitivo", score: 49 });
    expect(result.recommendation).toBe("fix_first");
    expect(result.reason).toContain("Mejora tu anuncio");
  });

  it("recommends when competitivo/bajo and score >= 75", () => {
    expect(resolveFeaturedRecommendation({ price_verdict: "competitivo", score: 75 }).recommendation).toBe("recommended");
    expect(resolveFeaturedRecommendation({ price_verdict: "bajo", score: 80 }).recommendation).toBe("recommended");
  });

  it("is neutral otherwise", () => {
    expect(resolveFeaturedRecommendation({ price_verdict: "competitivo", score: 74 })).toEqual({ recommendation: "neutral", reason: null });
    expect(resolveFeaturedRecommendation({ price_verdict: null, score: 90 }).recommendation).toBe("neutral");
    expect(resolveFeaturedRecommendation({ price_verdict: "sospechosamente_bajo", score: 90 }).recommendation).toBe("neutral");
  });
});
