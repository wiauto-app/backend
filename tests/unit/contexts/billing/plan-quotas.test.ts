import { describe, expect, it } from "vitest";

import {
  FREE_PLAN_QUOTAS,
  normalizePlanQuotas,
} from "@/src/contexts/billing/types/plan-quotas";

describe("normalizePlanQuotas", () => {
  it("usa defaults free cuando el input es vacío", () => {
    expect(normalizePlanQuotas(null)).toEqual(FREE_PLAN_QUOTAS);
    expect(normalizePlanQuotas(undefined)).toEqual(FREE_PLAN_QUOTAS);
  });

  it("normaliza enteros y allow_videos", () => {
    expect(
      normalizePlanQuotas({
        max_listings: 12.7,
        max_photos: 9,
        allow_videos: true,
        featured_monthly: 2,
      }),
    ).toEqual({
      max_listings: 12,
      max_photos: 9,
      allow_videos: true,
      featured_monthly: 2,
    });
  });

  it("free defaults son 3 anuncios, 6 fotos y sin vídeos", () => {
    expect(FREE_PLAN_QUOTAS).toEqual({
      max_listings: 3,
      max_photos: 6,
      allow_videos: false,
    });
  });
});
