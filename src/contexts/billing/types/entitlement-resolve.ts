import {
  ENTITLEMENT_FEATURE,
  ENTITLEMENT_VALUE_TYPE,
  EntitlementDefinition,
  EntitlementFeature,
  EntitlementValue,
  EntitlementValueType,
  FREE_ENTITLEMENTS,
  booleanValue,
  limitValue,
  unlimitedValue,
} from "./entitlement-features";
import { PlanQuotas } from "./plan-quotas";

export interface EffectiveEntitlement {
  feature: string;
  value_type: EntitlementValueType;
  value: EntitlementValue;
  source: "override" | "plan_version" | "free" | "admin";
}

export interface EntitlementUsageSnapshot {
  used?: number;
  limit: number | null;
  remaining: number | null;
}

export interface EntitlementFeatureSummary {
  type: EntitlementValueType;
  value?: boolean;
  limit?: number | null;
  used?: number;
  remaining?: number | null;
  unlimited?: boolean;
}

export interface ResolvedEntitlements {
  features: Record<string, EffectiveEntitlement>;
  source: "subscription" | "dealership_owner" | "free" | "admin";
  plan_id: string | null;
  plan_name: string | null;
  plan_version_id: string | null;
  subscription_id: string | null;
  dealership_id: string | null;
  listings_used: number;
  listings_scope: "dealership" | "profile";
  is_unlimited: boolean;
  /** @deprecated Compat legacy guards/UI */
  quotas: PlanQuotas;
}

export interface BillingMeEntitlementEntry {
  type: EntitlementValueType;
  value?: boolean;
  limit?: number | null;
  used?: number;
  remaining?: number | null;
  unlimited?: boolean;
}

export interface BillingMeSummary {
  subscription: {
    id: string;
    plan_id: string;
    plan_name: string;
    plan_version_id: string | null;
    status: string;
    current_period_end: Date | null;
    cancel_at_period_end: boolean;
  } | null;
  entitlements: Record<string, BillingMeEntitlementEntry>;
  /** @deprecated Preferir entitlements.vehicles */
  vehicle_listings_used: number;
  /** @deprecated Preferir entitlements.vehicles.limit */
  vehicle_listings_max: number | null;
  /** @deprecated Preferir entitlements */
  quotas: PlanQuotas;
  usage: {
    listings_used: number;
    listings_scope: "dealership" | "profile";
    dealership_id: string | null;
  };
  source: ResolvedEntitlements["source"];
  plan_id: string | null;
  stripe_customer_id: string | null;
}

export interface PlanCatalogEntitlement {
  feature: string;
  value_type: EntitlementValueType;
  value: EntitlementValue;
}

export interface UsageCheckResult {
  feature: string;
  used: number;
  limit: number | null;
  remaining: number | null;
  allowed: boolean;
}

export const mergeEntitlements = (
  base: EntitlementDefinition[],
  overrides: EntitlementDefinition[],
  base_source: EffectiveEntitlement["source"] = "plan_version",
): Record<string, EffectiveEntitlement> => {
  const merged: Record<string, EffectiveEntitlement> = {};

  for (const item of base) {
    merged[item.feature] = {
      feature: item.feature,
      value_type: item.value_type,
      value: item.value,
      source: base_source,
    };
  }

  for (const item of overrides) {
    merged[item.feature] = {
      feature: item.feature,
      value_type: item.value_type,
      value: item.value,
      source: "override",
    };
  }

  return merged;
};

export const buildFreeEntitlementsMap = (): Record<string, EffectiveEntitlement> =>
  mergeEntitlements(FREE_ENTITLEMENTS, [], "free");

export const buildUnlimitedEntitlementsMap = (): Record<string, EffectiveEntitlement> => {
  const features: EntitlementFeature[] = [
    ENTITLEMENT_FEATURE.VEHICLES,
    ENTITLEMENT_FEATURE.PHOTOS_PER_VEHICLE,
    ENTITLEMENT_FEATURE.VIDEOS_PER_VEHICLE,
    ENTITLEMENT_FEATURE.AI_REQUESTS,
    ENTITLEMENT_FEATURE.USERS,
  ];
  const booleans: EntitlementFeature[] = [
    ENTITLEMENT_FEATURE.VIDEO_UPLOAD,
    ENTITLEMENT_FEATURE.AI_GENERATION,
    ENTITLEMENT_FEATURE.STATISTICS,
    ENTITLEMENT_FEATURE.FEATURED_LISTINGS,
    ENTITLEMENT_FEATURE.DISMISSED_VEHICLES,
    ENTITLEMENT_FEATURE.ADVANCED_LISTING_EDITOR,
  ];

  const map: Record<string, EffectiveEntitlement> = {};
  for (const feature of features) {
    map[feature] = {
      feature,
      value_type: ENTITLEMENT_VALUE_TYPE.UNLIMITED,
      value: unlimitedValue(),
      source: "admin",
    };
  }
  for (const feature of booleans) {
    map[feature] = {
      feature,
      value_type: ENTITLEMENT_VALUE_TYPE.BOOLEAN,
      value: booleanValue(true),
      source: "admin",
    };
  }
  return map;
};

export const getLimitFromEntitlement = (
  entitlement: EffectiveEntitlement | undefined,
): number | null => {
  if (!entitlement) {
    return 0;
  }
  if (entitlement.value_type === ENTITLEMENT_VALUE_TYPE.UNLIMITED) {
    return null;
  }
  if (entitlement.value_type === ENTITLEMENT_VALUE_TYPE.LIMIT) {
    const value = entitlement.value as { limit?: number };
    return typeof value.limit === "number" ? value.limit : 0;
  }
  return 0;
};

export const getBooleanFromEntitlement = (
  entitlement: EffectiveEntitlement | undefined,
): boolean => {
  if (!entitlement) {
    return false;
  }
  if (entitlement.value_type === ENTITLEMENT_VALUE_TYPE.UNLIMITED) {
    return true;
  }
  if (entitlement.value_type === ENTITLEMENT_VALUE_TYPE.BOOLEAN) {
    const value = entitlement.value as { bool?: boolean };
    return value.bool === true;
  }
  if (entitlement.value_type === ENTITLEMENT_VALUE_TYPE.LIMIT) {
    const limit = getLimitFromEntitlement(entitlement);
    return limit === null || limit > 0;
  }
  return false;
};

export const toLegacyQuotas = (
  features: Record<string, EffectiveEntitlement>,
): PlanQuotas => {
  const vehicles = getLimitFromEntitlement(features[ENTITLEMENT_FEATURE.VEHICLES]);
  const photos = getLimitFromEntitlement(
    features[ENTITLEMENT_FEATURE.PHOTOS_PER_VEHICLE],
  );
  return {
    max_listings: vehicles ?? Number.MAX_SAFE_INTEGER,
    max_photos: photos ?? Number.MAX_SAFE_INTEGER,
    allow_videos: getBooleanFromEntitlement(
      features[ENTITLEMENT_FEATURE.VIDEO_UPLOAD],
    ),
  };
};

export const toBillingMeEntitlementEntry = (
  entitlement: EffectiveEntitlement,
  used?: number,
): BillingMeEntitlementEntry => {
  if (entitlement.value_type === ENTITLEMENT_VALUE_TYPE.BOOLEAN) {
    return {
      type: ENTITLEMENT_VALUE_TYPE.BOOLEAN,
      value: getBooleanFromEntitlement(entitlement),
    };
  }

  if (entitlement.value_type === ENTITLEMENT_VALUE_TYPE.UNLIMITED) {
    return {
      type: ENTITLEMENT_VALUE_TYPE.UNLIMITED,
      unlimited: true,
      limit: null,
      used,
      remaining: null,
    };
  }

  const limit = getLimitFromEntitlement(entitlement);
  return {
    type: ENTITLEMENT_VALUE_TYPE.LIMIT,
    limit,
    used,
    remaining:
      limit === null || used === undefined ? null : Math.max(limit - used, 0),
  };
};

export const definitionFromRow = (row: {
  feature: string;
  value_type: EntitlementValueType;
  value: EntitlementValue;
}): EntitlementDefinition => ({
  feature: row.feature as EntitlementFeature,
  value_type: row.value_type,
  value: row.value,
});

export { limitValue, booleanValue, unlimitedValue };
