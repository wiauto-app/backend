import { ProfessionalAccountType } from "./billing.enums";
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

/** Fiscal data persisted in professional_accounts (shared by all subscription flows). */
export interface ProfessionalAccountInput {
  account_type: ProfessionalAccountType;
  legal_name: string;
  commercial_name?: string;
  tax_id: string;
  email: string;
  phone_code: string;
  phone: string;
}

export interface BillingAddressInput {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  /** ISO 3166-1 alpha-2, upper case. */
  country: string;
}

export type SubscriptionPaymentSheetIntentType = "payment" | "setup" | "none";

export interface SubscriptionPaymentSheetResult {
  intent_type: SubscriptionPaymentSheetIntentType;
  client_secret: string | null;
  customer_session_client_secret: string;
  customer_id: string;
  subscription_id: string;
}

export type {
  BillingMeSummary,
  ResolvedEntitlements,
  UsageCheckResult,
} from "./entitlement-resolve";
