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

export type PrimitivePlanFeature = {
  id?: string;
  plan_id?: string;
  label: string;
  description?: string | null;
  included: boolean;
  sort_order: number;
};

export type PrimitivePlanPrice = {
  id?: string;
  plan_id?: string;
  interval: string;
  amount_cents: number;
  currency: string;
  stripe_price_id?: string | null;
  is_active: boolean;
};

export type PrimitiveSubscriptionPlan = {
  id?: string;
  slug: string;
  name: string;
  description?: string | null;
  audience: string;
  billing_type: string;
  role_id?: string | null;
  stripe_product_id?: string | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  effect_config?: PlanEffectConfig;
  prices?: PrimitivePlanPrice[];
  features?: PrimitivePlanFeature[];
  created_at?: Date;
  updated_at?: Date;
};

export class SubscriptionPlan {
  constructor(private readonly props: PrimitiveSubscriptionPlan) {}

  static create(props: Omit<PrimitiveSubscriptionPlan, "id">): SubscriptionPlan {
    return new SubscriptionPlan({ ...props });
  }

  static fromPrimitives(props: PrimitiveSubscriptionPlan): SubscriptionPlan {
    return new SubscriptionPlan(props);
  }

  toPrimitives(): PrimitiveSubscriptionPlan {
    return { ...this.props };
  }

  get id(): string | undefined {
    return this.props.id;
  }

  get role_id(): string | null | undefined {
    return this.props.role_id;
  }

  get stripe_product_id(): string | null | undefined {
    return this.props.stripe_product_id;
  }

  applyUpdates(updates: Partial<PrimitiveSubscriptionPlan>): SubscriptionPlan {
    return new SubscriptionPlan({ ...this.props, ...updates });
  }
}
