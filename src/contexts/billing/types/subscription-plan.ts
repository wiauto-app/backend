export type PlanEffectConfigType = "assistant_credits" | "feature_vehicle";

export interface AssistantCreditsEffectConfig {
  type: "assistant_credits";
  credits: number;
}

export interface FeatureVehicleEffectConfig {
  type: "feature_vehicle";
}

export type PlanEffectConfig =
  | AssistantCreditsEffectConfig
  | FeatureVehicleEffectConfig
  | Record<string, never>;

export interface PlanFeatureInput {
  id?: string;
  plan_id?: string;
  label: string;
  description?: string | null;
  included: boolean;
  sort_order: number;
}

export interface PlanPriceInput {
  id?: string;
  plan_id?: string;
  interval: string;
  amount_cents: number;
  currency: string;
  stripe_price_id?: string | null;
  is_active: boolean;
}

export interface CreateSubscriptionPlanData {
  name: string;
  slug?: string | null;
  description?: string | null;
  /** @deprecated */
  audience?: string | null;
  billing_type: string;
  type?: string;
  stripe_product_id?: string | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  effect_config?: PlanEffectConfig;
  prices?: PlanPriceInput[];
  features?: PlanFeatureInput[];
}

export interface UpdateSubscriptionPlanData extends CreateSubscriptionPlanData {
  id: string;
}
