import {
  booleanValue,
  limitValue,
  unlimitedValue,
  ENTITLEMENT_FEATURE,
  ENTITLEMENT_VALUE_TYPE,
  FREE_ENTITLEMENTS,
} from "@/src/contexts/billing/types/entitlement-features";
import {
  buildFreeEntitlementsMap,
  getBooleanFromEntitlement,
  getLimitFromEntitlement,
  mergeEntitlements,
  toLegacyQuotas,
} from "@/src/contexts/billing/types/entitlement-resolve";

describe("entitlement merge precedence", () => {
  it("applies override over plan version over free", () => {
    const free = FREE_ENTITLEMENTS;
    const plan = [
      {
        feature: ENTITLEMENT_FEATURE.VEHICLES,
        value_type: ENTITLEMENT_VALUE_TYPE.LIMIT,
        value: limitValue(50),
      },
      {
        feature: ENTITLEMENT_FEATURE.VIDEO_UPLOAD,
        value_type: ENTITLEMENT_VALUE_TYPE.BOOLEAN,
        value: booleanValue(true),
      },
    ];
    const overrides = [
      {
        feature: ENTITLEMENT_FEATURE.VEHICLES,
        value_type: ENTITLEMENT_VALUE_TYPE.LIMIT,
        value: limitValue(200),
      },
    ];

    const with_plan = mergeEntitlements(free, plan, "plan_version");
    const effective = mergeEntitlements(
      Object.values(with_plan).map((item) => ({
        feature: item.feature as typeof ENTITLEMENT_FEATURE.VEHICLES,
        value_type: item.value_type,
        value: item.value,
      })),
      overrides,
      "plan_version",
    );

    expect(getLimitFromEntitlement(effective[ENTITLEMENT_FEATURE.VEHICLES])).toBe(
      200,
    );
    expect(
      effective[ENTITLEMENT_FEATURE.VEHICLES]?.source,
    ).toBe("override");
    expect(
      getBooleanFromEntitlement(effective[ENTITLEMENT_FEATURE.VIDEO_UPLOAD]),
    ).toBe(true);
    expect(
      getLimitFromEntitlement(effective[ENTITLEMENT_FEATURE.PHOTOS_PER_VEHICLE]),
    ).toBe(10);
  });

  it("treats unlimited as null limit", () => {
    const features = mergeEntitlements(
      FREE_ENTITLEMENTS,
      [
        {
          feature: ENTITLEMENT_FEATURE.VEHICLES,
          value_type: ENTITLEMENT_VALUE_TYPE.UNLIMITED,
          value: unlimitedValue(),
        },
      ],
      "plan_version",
    );

    expect(getLimitFromEntitlement(features[ENTITLEMENT_FEATURE.VEHICLES])).toBe(
      null,
    );
  });

  it("maps legacy quotas from entitlements", () => {
    const features = buildFreeEntitlementsMap();
    const quotas = toLegacyQuotas(features);
    expect(quotas.max_listings).toBe(2);
    expect(quotas.max_photos).toBe(10);
    expect(quotas.allow_videos).toBe(false);
  });
});

describe("usage check math", () => {
  it("blocks when used >= limit", () => {
    const used = 50;
    const limit = 50;
    const remaining = Math.max(limit - used, 0);
    const allowed = used < limit;
    expect(remaining).toBe(0);
    expect(allowed).toBe(false);
  });

  it("allows when unlimited (null limit)", () => {
    const used = 999;
    const limit: number | null = null;
    const allowed = limit === null || used < limit;
    expect(allowed).toBe(true);
  });
});
