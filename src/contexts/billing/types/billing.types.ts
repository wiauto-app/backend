import { EntitlementValue, EntitlementValueType } from "./entitlement-features";

export interface PlanCatalogPrice {
  id: string;
  interval: string;
  amount_cents: number;
  currency: string;
}

export interface PlanCatalogFeature {
  id: string;
  label: string;
  description: string | null;
  included: boolean;
}

export interface PlanCatalogEntitlement {
  feature: string;
  value_type: EntitlementValueType;
  value: EntitlementValue;
}

export interface PlanCatalogItem {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  audience: string | null;
  billing_type: string;
  type: string;
  is_featured: boolean;
  sort_order: number;
  effect_config?: Record<string, unknown>;
  plan_version_id: string | null;
  prices: PlanCatalogPrice[];
  features: PlanCatalogFeature[];
  entitlements: PlanCatalogEntitlement[];
}

export type {
  BillingMeSummary,
  ResolvedEntitlements,
  UsageCheckResult,
} from "./entitlement-resolve";
