import { describe, expect, it } from "vitest";

import { PRICE_VERDICT } from "@/src/contexts/vehicles/types/vehicle-insights";
import {
  evaluatePriceAboveMarket,
  evaluateStaleLowViews,
} from "@/src/contexts/proactive-alerts/utils/proactive-alert-rules";

describe("proactive-alert-rules", () => {
  it("detecta precio alto con precio sugerido", () => {
    const payload = evaluatePriceAboveMarket({
      verdict: PRICE_VERDICT.ALTO,
      suggested_price: 15000,
      vehicle_id: "veh-1",
    });
    expect(payload?.title).toContain("Precio");
  });

  it("ignora anuncios recientes con visitas normales", () => {
    const payload = evaluateStaleLowViews({
      days_published: 10,
      daily_views: 2,
      segment_daily_views: 1,
      suggested_price_drop_eur: 500,
      vehicle_id: "veh-1",
    });
    expect(payload).toBeNull();
  });
});
