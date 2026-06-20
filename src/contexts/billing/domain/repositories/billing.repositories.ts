import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import {
  PrimitivePlanFeature,
  PrimitivePlanPrice,
  SubscriptionPlan,
} from "../entities/subscription-plan";

export type PlanCatalogPrice = {
  id: string;
  interval: string;
  amount_cents: number;
  currency: string;
};

export type PlanCatalogFeature = {
  id: string;
  label: string;
  description: string | null;
  included: boolean;
};

export type PlanCatalogItem = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  audience: string;
  billing_type: string;
  is_featured: boolean;
  sort_order: number;
  prices: PlanCatalogPrice[];
  features: PlanCatalogFeature[];
};

export type BillingMeSummary = {
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
};

export abstract class SubscriptionPlanRepository {
  abstract create(plan: SubscriptionPlan): Promise<SubscriptionPlan>;
  abstract update(plan: SubscriptionPlan): Promise<SubscriptionPlan>;
  abstract delete(id: string): Promise<void>;
  abstract findOne(id: string): Promise<SubscriptionPlan | null>;
  abstract findBySlug(slug: string): Promise<SubscriptionPlan | null>;
  abstract findAll(params: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<PaginatedResult<SubscriptionPlan>>;
  abstract findCatalog(audience?: string): Promise<SubscriptionPlan[]>;
  abstract savePrices(plan_id: string, prices: PrimitivePlanPrice[]): Promise<void>;
  abstract saveFeatures(plan_id: string, features: PrimitivePlanFeature[]): Promise<void>;
  abstract findPriceById(price_id: string): Promise<{ id: string; plan_id: string; stripe_price_id: string | null; interval: string; amount_cents: number; currency: string; is_active: boolean; plan: SubscriptionPlan } | null>;
}

export abstract class SubscriptionRepository {
  abstract upsert(data: {
    profile_id: string;
    plan_id: string;
    stripe_customer_id: string;
    stripe_subscription_id: string;
    status: string;
    current_period_start: Date | null;
    current_period_end: Date | null;
    cancel_at_period_end: boolean;
  }): Promise<void>;
  abstract findActiveByProfileId(profile_id: string): Promise<{
    id: string;
    plan_id: string;
    status: string;
    current_period_end: Date | null;
    cancel_at_period_end: boolean;
    plan_name: string;
    plan_slug: string;
  } | null>;
  abstract findByStripeSubscriptionId(stripe_subscription_id: string): Promise<{
    cancel_at_period_end: boolean;
  } | null>;
  abstract findAllAdmin(params: {
    page: number;
    limit: number;
  }): Promise<PaginatedResult<Record<string, unknown>>>;
}

export abstract class BillingInvoiceRepository {
  abstract upsert(data: {
    profile_id: string;
    stripe_invoice_id: string;
    amount_paid_cents: number;
    currency: string;
    status: string;
    invoice_pdf_url: string | null;
    hosted_invoice_url: string | null;
    paid_at: Date | null;
  }): Promise<void>;
  abstract findByProfileId(profile_id: string): Promise<Array<{
    id: string;
    stripe_invoice_id: string;
    amount_paid_cents: number;
    currency: string;
    status: string;
    invoice_pdf_url: string | null;
    hosted_invoice_url: string | null;
    paid_at: Date | null;
    created_at: Date;
  }>>;
}

export abstract class OneTimePurchaseRepository {
  abstract create(data: {
    profile_id: string;
    plan_id: string;
    stripe_payment_intent_id: string | null;
    status: string;
    metadata: Record<string, unknown>;
  }): Promise<void>;
}

export abstract class StripeWebhookEventRepository {
  abstract exists(event_id: string): Promise<boolean>;
  abstract save(event_id: string, event_type: string): Promise<void>;
}

export abstract class BillingProfileRepository {
  abstract findById(profile_id: string): Promise<{
    id: string;
    stripe_customer_id: string | null;
    role_id: string | null;
    email: string;
    name: string;
    type: string;
  } | null>;
  abstract updateStripeCustomerId(profile_id: string, stripe_customer_id: string): Promise<void>;
  abstract updateRoleId(profile_id: string, role_id: string | null): Promise<void>;
  abstract updatePublisherType(profile_id: string, type: string): Promise<void>;
  abstract findByStripeCustomerId(stripe_customer_id: string): Promise<{ id: string } | null>;
  abstract findByEmail(email: string): Promise<{
    id: string;
    stripe_customer_id: string | null;
    role_id: string | null;
    email: string;
    name: string;
    type: string;
  } | null>;
}
