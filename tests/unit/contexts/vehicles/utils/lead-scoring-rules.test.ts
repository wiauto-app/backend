import { describe, expect, it } from "vitest";

import { LEAD_TYPE } from "@/src/contexts/vehicles/types/lead";
import { LEAD_SCORE_SIGNAL, LEAD_TIER } from "@/src/contexts/vehicles/types/lead-scoring";
import { computeLeadScore } from "@/src/contexts/vehicles/utils/lead-scoring-rules";

describe("computeLeadScore", () => {
  it("marca hot cuando hay intención fuerte", () => {
    const result = computeLeadScore({
      type: LEAD_TYPE.CONTACT,
      is_authenticated: true,
      has_phone: true,
      buyer_texts: ["Quiero reservar el coche y hablar de financiación"],
      buyer_chat_messages_count: 4,
      fastest_buyer_reply_minutes: 5,
      other_recent_leads_count: 0,
      ai_hot: false,
    });

    expect(result.tier).toBe(LEAD_TIER.HOT);
    expect(result.signals).toContain(LEAD_SCORE_SIGNAL.FINANCING);
    expect(result.signals).toContain(LEAD_SCORE_SIGNAL.PURCHASE_INTENT);
  });

  it("suma la señal FINANCING en leads de tipo financing aunque el texto no la mencione", () => {
    const result = computeLeadScore({
      type: LEAD_TYPE.FINANCING,
      is_authenticated: false,
      has_phone: true,
      buyer_texts: ["Hola"],
      buyer_chat_messages_count: 0,
      fastest_buyer_reply_minutes: null,
      other_recent_leads_count: 0,
      ai_hot: false,
    });

    expect(result.signals).toContain(LEAD_SCORE_SIGNAL.FINANCING);
    expect(result.signals).not.toContain(LEAD_SCORE_SIGNAL.LOW_DETAIL);
  });
});
