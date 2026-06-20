import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import Stripe from "stripe";

import { envs } from "@/src/common/envs";
import { BILLING_TYPE, PRICE_INTERVAL } from "../../domain/enums/billing.enums";
import { SubscriptionPlan } from "../../domain/entities/subscription-plan";

@Injectable()
export class StripeBillingAdapter {
  private readonly stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(envs.STRIPE_SECRET_KEY);
  }

  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    if (!envs.STRIPE_WEBHOOK_SECRET) {
      throw new Error("STRIPE_WEBHOOK_SECRET no configurado");
    }

    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      envs.STRIPE_WEBHOOK_SECRET,
    );
  }

  async createOrUpdateProduct(plan: SubscriptionPlan): Promise<string> {
    const p = plan.toPrimitives();

    if (p.stripe_product_id) {
      await this.stripe.products.update(p.stripe_product_id, {
        name: p.name,
        description: p.description ?? undefined,
        active: p.is_active,
        metadata: {
          plan_id: p.id ?? "",
          slug: p.slug,
          audience: p.audience,
          billing_type: p.billing_type,
        },
      });
      return p.stripe_product_id;
    }

    const product = await this.stripe.products.create({
      name: p.name,
      description: p.description ?? undefined,
      active: p.is_active,
      metadata: {
        plan_id: p.id ?? "",
        slug: p.slug,
        audience: p.audience,
        billing_type: p.billing_type,
      },
    });

    return product.id;
  }

  async createOrUpdatePrice(params: {
    stripe_product_id: string;
    price_id?: string;
    amount_cents: number;
    currency: string;
    interval: string;
    billing_type: string;
  }): Promise<string> {
    if (params.price_id) {
      await this.stripe.prices.update(params.price_id, { active: true });
      return params.price_id;
    }

    const recurring =
      params.billing_type === BILLING_TYPE.RECURRING
        ? {
            interval:
              params.interval === PRICE_INTERVAL.YEAR
                ? ("year" as const)
                : ("month" as const),
          }
        : undefined;

    const price = await this.stripe.prices.create({
      product: params.stripe_product_id,
      unit_amount: params.amount_cents,
      currency: params.currency.toLowerCase(),
      ...(recurring ? { recurring } : {}),
    });

    return price.id;
  }

  async createCustomer(params: {
    email: string;
    name: string;
    profile_id: string;
  }): Promise<string> {
    const customer = await this.stripe.customers.create({
      email: params.email,
      name: params.name,
      metadata: { profile_id: params.profile_id },
    });

    return customer.id;
  }

  async createSubscriptionCheckout(params: {
    customer_id: string;
    stripe_price_id: string;
    profile_id: string;
    plan_id: string;
    plan_price_id: string;
  }): Promise<string> {
    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      customer: params.customer_id,
      line_items: [{ price: params.stripe_price_id, quantity: 1 }],
      success_url: envs.STRIPE_SUCCESS_URL,
      cancel_url: envs.STRIPE_CANCEL_URL,
      metadata: {
        profile_id: params.profile_id,
        plan_id: params.plan_id,
        plan_price_id: params.plan_price_id,
      },
      subscription_data: {
        metadata: {
          profile_id: params.profile_id,
          plan_id: params.plan_id,
        },
      },
    });

    if (!session.url) {
      throw new Error("Stripe no devolvió checkout_url");
    }

    return session.url;
  }

  async createGuestSubscriptionCheckout(params: {
    stripe_price_id: string;
    plan_id: string;
    plan_price_id: string;
  }): Promise<string> {
    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: params.stripe_price_id, quantity: 1 }],
      success_url: envs.STRIPE_SUCCESS_URL,
      cancel_url: envs.STRIPE_CANCEL_URL,
      metadata: {
        plan_id: params.plan_id,
        plan_price_id: params.plan_price_id,
        guest: "true",
      },
      subscription_data: {
        metadata: {
          plan_id: params.plan_id,
          plan_price_id: params.plan_price_id,
          guest: "true",
        },
      },
    });

    if (!session.url) {
      throw new Error("Stripe no devolvió checkout_url");
    }

    return session.url;
  }

  async retrieveCheckoutSession(session_id: string): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.retrieve(session_id, {
      expand: ["subscription", "customer"],
    });
  }

  async retrieveSubscription(subscription_id: string): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.retrieve(subscription_id);
  }

  async updateCustomerMetadata(
    customer_id: string,
    metadata: Record<string, string>,
  ): Promise<void> {
    await this.stripe.customers.update(customer_id, { metadata });
  }

  async updateSubscriptionMetadata(
    subscription_id: string,
    metadata: Record<string, string>,
  ): Promise<void> {
    await this.stripe.subscriptions.update(subscription_id, { metadata });
  }

  async createOneTimeCheckout(params: {
    customer_id: string;
    stripe_price_id: string;
    profile_id: string;
    plan_id: string;
    plan_price_id: string;
    metadata?: Record<string, string>;
  }): Promise<string> {
    const session = await this.stripe.checkout.sessions.create({
      mode: "payment",
      customer: params.customer_id,
      line_items: [{ price: params.stripe_price_id, quantity: 1 }],
      success_url: envs.STRIPE_SUCCESS_URL,
      cancel_url: envs.STRIPE_CANCEL_URL,
      metadata: {
        profile_id: params.profile_id,
        plan_id: params.plan_id,
        plan_price_id: params.plan_price_id,
        ...(params.metadata ?? {}),
      },
    });

    if (!session.url) {
      throw new Error("Stripe no devolvió checkout_url");
    }

    return session.url;
  }

  async createPortalSession(customer_id: string): Promise<string> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: customer_id,
      return_url: `${envs.FRONTEND_URL}/monetizacion`,
    });

    if (!session.url) {
      throw new Error("Stripe no devolvió portal_url");
    }

    return session.url;
  }
}
