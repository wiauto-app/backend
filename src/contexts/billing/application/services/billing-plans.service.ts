import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { Injectable as HexInjectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import {
  PrimitiveSubscriptionPlan,
  SubscriptionPlan,
} from "../../domain/entities/subscription-plan";
import { PlanNotFoundException } from "../../domain/exceptions/billing.exceptions";
import {
  BillingProfileRepository,
  SubscriptionPlanRepository,
} from "../../domain/repositories/billing.repositories";
import { StripeBillingAdapter } from "../../infrastructure/stripe/stripe-billing.adapter";
import { TypeOrmSubscriptionPlanRepository } from "../../infrastructure/repositories/typeorm.subscription-plan-repository";
import { BILLING_TYPE } from "../../domain/enums/billing.enums";

export type CreatePlanPayload = {
  slug: string;
  name: string;
  description?: string | null;
  audience: string;
  billing_type: string;
  role_id?: string | null;
  is_active?: boolean;
  is_featured?: boolean;
  sort_order?: number;
  prices?: Array<{
    interval: string;
    amount_cents: number;
    currency?: string;
    is_active?: boolean;
  }>;
  features?: Array<{
    label: string;
    description?: string | null;
    included?: boolean;
    sort_order?: number;
  }>;
};

export type UpdatePlanPayload = Partial<CreatePlanPayload>;

const serializePlan = (plan: SubscriptionPlan): PrimitiveSubscriptionPlan =>
  plan.toPrimitives();

@HexInjectable()
export class BillingPlansService {
  constructor(
    private readonly plan_repository: SubscriptionPlanRepository,
    private readonly stripe_adapter: StripeBillingAdapter,
  ) {}

  async create(payload: CreatePlanPayload) {
    const plan = SubscriptionPlan.create({
      slug: payload.slug,
      name: payload.name,
      description: payload.description ?? null,
      audience: payload.audience,
      billing_type: payload.billing_type,
      role_id: payload.role_id ?? null,
      is_active: payload.is_active ?? true,
      is_featured: payload.is_featured ?? false,
      sort_order: payload.sort_order ?? 0,
      prices: payload.prices?.map((price) => ({
        interval: price.interval,
        amount_cents: price.amount_cents,
        currency: price.currency ?? "eur",
        is_active: price.is_active ?? true,
      })),
      features: payload.features?.map((feature, index) => ({
        label: feature.label,
        description: feature.description ?? null,
        included: feature.included ?? true,
        sort_order: feature.sort_order ?? index,
      })),
    });

    const created = await this.plan_repository.create(plan);
    return serializePlan(created);
  }

  async findAll(params: { page: number; limit: number; search?: string }) {
    const result = await this.plan_repository.findAll(params);
    return result.map(serializePlan);
  }

  private async findOneEntity(id: string): Promise<SubscriptionPlan> {
    const plan = await this.plan_repository.findOne(id);
    if (!plan) {
      throw new NotFoundException(new PlanNotFoundException(id).message);
    }
    return plan;
  }

  async findOne(id: string) {
    const plan = await this.findOneEntity(id);
    return serializePlan(plan);
  }

  async update(id: string, payload: UpdatePlanPayload) {
    const existing = await this.findOneEntity(id);
    const current = existing.toPrimitives();

    const updated = existing.applyUpdates({
      slug: payload.slug ?? current.slug,
      name: payload.name ?? current.name,
      description: payload.description !== undefined ? payload.description : current.description,
      audience: payload.audience ?? current.audience,
      billing_type: payload.billing_type ?? current.billing_type,
      role_id: payload.role_id !== undefined ? payload.role_id : current.role_id,
      is_active: payload.is_active ?? current.is_active,
      is_featured: payload.is_featured ?? current.is_featured,
      sort_order: payload.sort_order ?? current.sort_order,
      prices: payload.prices
        ? payload.prices.map((price) => ({
            interval: price.interval,
            amount_cents: price.amount_cents,
            currency: price.currency ?? "eur",
            is_active: price.is_active ?? true,
          }))
        : current.prices,
      features: payload.features
        ? payload.features.map((feature, index) => ({
            label: feature.label,
            description: feature.description ?? null,
            included: feature.included ?? true,
            sort_order: feature.sort_order ?? index,
          }))
        : current.features,
    });

    const saved = await this.plan_repository.update(updated);
    return serializePlan(saved);
  }

  async remove(id: string) {
    await this.findOneEntity(id);
    await this.plan_repository.delete(id);
  }

  async syncStripe(id: string) {
    const plan = await this.findOneEntity(id);
    const p = plan.toPrimitives();

    const stripe_product_id = await this.stripe_adapter.createOrUpdateProduct(plan);
    const price_updates: Array<{ id: string; stripe_price_id: string }> = [];

    for (const price of p.prices ?? []) {
      if (!price.id) {
        continue;
      }

      const stripe_price_id = await this.stripe_adapter.createOrUpdatePrice({
        stripe_product_id,
        price_id: price.stripe_price_id ?? undefined,
        amount_cents: price.amount_cents,
        currency: price.currency,
        interval: price.interval,
        billing_type: p.billing_type,
      });

      price_updates.push({ id: price.id, stripe_price_id });
    }

    const repo = this.plan_repository as TypeOrmSubscriptionPlanRepository;
    await repo.updateStripeIds(id, stripe_product_id, price_updates);

    return serializePlan(await this.findOneEntity(id));
  }

  async findCatalog(audience?: string) {
    const plans = await this.plan_repository.findCatalog(audience);

    return plans.map((plan) => {
      const p = plan.toPrimitives();
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        description: p.description,
        audience: p.audience,
        billing_type: p.billing_type,
        is_featured: p.is_featured,
        sort_order: p.sort_order,
        prices: (p.prices ?? [])
          .filter((price) => price.is_active)
          .map((price) => ({
            id: price.id,
            interval: price.interval,
            amount_cents: price.amount_cents,
            currency: price.currency,
          })),
        features: (p.features ?? []).map((feature) => ({
          id: feature.id,
          label: feature.label,
          description: feature.description ?? null,
          included: feature.included,
        })),
      };
    });
  }
}

@HexInjectable()
export class BillingCheckoutService {
  constructor(
    private readonly plan_repository: SubscriptionPlanRepository,
    private readonly billing_profile_repository: BillingProfileRepository,
    private readonly stripe_adapter: StripeBillingAdapter,
  ) {}

  private async resolveCustomer(profile_id: string) {
    const profile = await this.billing_profile_repository.findById(profile_id);
    if (!profile) {
      throw new NotFoundException("Perfil no encontrado");
    }

    if (profile.stripe_customer_id) {
      return profile.stripe_customer_id;
    }

    const customer_id = await this.stripe_adapter.createCustomer({
      email: profile.email,
      name: profile.name,
      profile_id: profile.id,
    });

    await this.billing_profile_repository.updateStripeCustomerId(profile_id, customer_id);
    return customer_id;
  }

  private async resolveRecurringPrice(plan_price_id: string) {
    const price = await this.plan_repository.findPriceById(plan_price_id);
    if (!price?.stripe_price_id) {
      throw new BadRequestException("El precio no está sincronizado con Stripe");
    }

    const plan = price.plan.toPrimitives();
    if (plan.billing_type !== BILLING_TYPE.RECURRING) {
      throw new BadRequestException("El plan no es de suscripción recurrente");
    }

    return price;
  }

  async createPublicSubscriptionCheckout(
    profile_id: string | undefined,
    plan_price_id: string,
  ) {
    if (profile_id) {
      return this.createSubscriptionCheckout(profile_id, plan_price_id);
    }

    return this.createGuestSubscriptionCheckout(plan_price_id);
  }

  async createSubscriptionCheckout(profile_id: string, plan_price_id: string) {
    const price = await this.resolveRecurringPrice(plan_price_id);
    const customer_id = await this.resolveCustomer(profile_id);
    const checkout_url = await this.stripe_adapter.createSubscriptionCheckout({
      customer_id,
      stripe_price_id: price.stripe_price_id!,
      profile_id,
      plan_id: price.plan_id,
      plan_price_id,
    });

    return { checkout_url };
  }

  private async createGuestSubscriptionCheckout(plan_price_id: string) {
    const price = await this.resolveRecurringPrice(plan_price_id);
    const checkout_url = await this.stripe_adapter.createGuestSubscriptionCheckout({
      stripe_price_id: price.stripe_price_id!,
      plan_id: price.plan_id,
      plan_price_id,
    });

    return { checkout_url };
  }

  async createOneTimeCheckout(
    profile_id: string,
    plan_price_id: string,
    metadata?: Record<string, string>,
  ) {
    const price = await this.plan_repository.findPriceById(plan_price_id);
    if (!price?.stripe_price_id) {
      throw new BadRequestException("El precio no está sincronizado con Stripe");
    }

    const plan = price.plan.toPrimitives();
    if (plan.billing_type !== BILLING_TYPE.ONE_TIME) {
      throw new BadRequestException("El plan no es de pago único");
    }

    const customer_id = await this.resolveCustomer(profile_id);
    const checkout_url = await this.stripe_adapter.createOneTimeCheckout({
      customer_id,
      stripe_price_id: price.stripe_price_id,
      profile_id,
      plan_id: price.plan_id,
      plan_price_id,
      metadata,
    });

    return { checkout_url };
  }

  async createPortalSession(profile_id: string) {
    const profile = await this.billing_profile_repository.findById(profile_id);
    if (!profile?.stripe_customer_id) {
      throw new BadRequestException("No tienes un cliente de Stripe asociado");
    }

    const portal_url = await this.stripe_adapter.createPortalSession(
      profile.stripe_customer_id,
    );

    return { portal_url };
  }
}
