import { PlanQuotas } from "./plan-quotas";

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

export interface PlanCatalogItem {
  id: string;
  name: string;
  description: string | null;
  audience: string;
  billing_type: string;
  is_featured: boolean;
  is_custom?: boolean;
  quotas?: PlanQuotas;
  sort_order: number;
  effect_config?: Record<string, unknown>;
  prices: PlanCatalogPrice[];
  features: PlanCatalogFeature[];
}

export interface BillingMeQuotas extends PlanQuotas {}

export interface BillingMeUsage {
  listings_used: number;
  listings_scope: "dealership" | "profile";
  dealership_id: string | null;
}

export interface BillingMeSummary {
  subscription: {
    id: string;
    plan_id: string;
    plan_name: string;
    status: string;
    current_period_end: Date | null;
    cancel_at_period_end: boolean;
  } | null;
  effective_role: {
    id: string;
    name: string;
  } | null;
  /** @deprecated Preferir `usage.listings_used` */
  vehicle_listings_used: number;
  /** @deprecated Preferir `quotas.max_listings` */
  vehicle_listings_max: number | null;
  quotas: BillingMeQuotas;
  usage: BillingMeUsage;
  source: "dealership_plan" | "own_subscription" | "free";
  plan_id: string | null;
  stripe_customer_id: string | null;
}

export interface ResolvedEntitlements {
  quotas: PlanQuotas;
  source: BillingMeSummary["source"];
  plan_id: string | null;
  plan_name: string | null;
  dealership_id: string | null;
  listings_used: number;
  listings_scope: BillingMeUsage["listings_scope"];
  is_unlimited: boolean;
}
