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
  slug: string;
  name: string;
  description: string | null;
  audience: string;
  billing_type: string;
  is_featured: boolean;
  sort_order: number;
  effect_config?: Record<string, unknown>;
  prices: PlanCatalogPrice[];
  features: PlanCatalogFeature[];
}

export interface BillingMeSummary {
  subscription: {
    id: string;
    plan_id: string;
    plan_name: string;
    plan_slug: string;
    status: string;
    current_period_end: Date | null;
    cancel_at_period_end: boolean;
  } | null;
  effective_role: {
    id: string;
    name: string;
  } | null;
  vehicle_listings_used: number;
  vehicle_listings_max: number | null;
  stripe_customer_id: string | null;
}
