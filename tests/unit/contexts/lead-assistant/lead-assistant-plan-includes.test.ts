import { describe, expect, it } from "vitest";

interface PlanLimits {
  replies_limit: number | null;
  leads_limit: number | null;
  is_unlimited: boolean;
}

const planIncludesAssistant = (limits: PlanLimits): boolean => {
  if (limits.is_unlimited) {
    return true;
  }

  return (
    limits.replies_limit === null ||
    limits.replies_limit > 0 ||
    limits.leads_limit === null ||
    limits.leads_limit > 0
  );
};

describe("planIncludesAssistant", () => {
  it("devuelve false cuando ambos límites son 0", () => {
    expect(
      planIncludesAssistant({
        replies_limit: 0,
        leads_limit: 0,
        is_unlimited: false,
      }),
    ).toBe(false);
  });

  it("devuelve true si al menos un límite es positivo o ilimitado", () => {
    expect(
      planIncludesAssistant({
        replies_limit: 3,
        leads_limit: 0,
        is_unlimited: false,
      }),
    ).toBe(true);

    expect(
      planIncludesAssistant({
        replies_limit: 0,
        leads_limit: null,
        is_unlimited: false,
      }),
    ).toBe(true);
  });
});
