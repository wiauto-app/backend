import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import Stripe from "stripe";

import { envs } from "@/src/common/envs";
import { BILLING_TYPE, PRICE_INTERVAL } from "../types/billing.enums";
import { SubscriptionPlan } from "../types/subscription-plan";

export const STRIPE_PREFERRED_LOCALES = ["es"] as const;
export const STRIPE_CHECKOUT_LOCALE = "es";

@Injectable()
export class StripeClient {
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
      preferred_locales: [...STRIPE_PREFERRED_LOCALES],
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
    plan_version_id: string;
    dealership_id?: string;
    lead_request_id?: string;
    professional_account_id?: string;
    billing_address_collection?: "auto" | "required";
    tax_id_collection?: { enabled: boolean };
    success_url?: string;
    cancel_url?: string;
  }): Promise<string> {
    const shared_metadata: Record<string, string> = {
      profile_id: params.profile_id,
      plan_id: params.plan_id,
      plan_price_id: params.plan_price_id,
      plan_version_id: params.plan_version_id,
    };
    if (params.dealership_id) {
      shared_metadata.dealership_id = params.dealership_id;
    }
    if (params.lead_request_id) {
      shared_metadata.lead_request_id = params.lead_request_id;
    }
    if (params.professional_account_id) {
      shared_metadata.professional_account_id = params.professional_account_id;
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      locale: STRIPE_CHECKOUT_LOCALE,
      customer: params.customer_id,
      line_items: [{ price: params.stripe_price_id, quantity: 1 }],
      success_url: this.resolveCheckoutUrl(
        params.success_url,
        envs.STRIPE_SUCCESS_URL,
      ),
      cancel_url: this.resolveCheckoutUrl(
        params.cancel_url,
        envs.STRIPE_CANCEL_URL,
      ),
      allow_promotion_codes: true,
      ...(params.billing_address_collection
        ? { billing_address_collection: params.billing_address_collection }
        : {}),
      ...(params.tax_id_collection
        ? { tax_id_collection: params.tax_id_collection }
        : {}),
      metadata: shared_metadata,
      subscription_data: {
        metadata: {
          profile_id: params.profile_id,
          plan_id: params.plan_id,
          plan_version_id: params.plan_version_id,
          ...(params.dealership_id
            ? { dealership_id: params.dealership_id }
            : {}),
          ...(params.lead_request_id
            ? { lead_request_id: params.lead_request_id }
            : {}),
          ...(params.professional_account_id
            ? { professional_account_id: params.professional_account_id }
            : {}),
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
    plan_version_id: string;
    lead_request_id?: string;
    customer_email?: string;
  }): Promise<string> {
    const shared_metadata: Record<string, string> = {
      plan_id: params.plan_id,
      plan_price_id: params.plan_price_id,
      plan_version_id: params.plan_version_id,
      guest: "true",
    };
    if (params.lead_request_id) {
      shared_metadata.lead_request_id = params.lead_request_id;
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      locale: STRIPE_CHECKOUT_LOCALE,
      line_items: [{ price: params.stripe_price_id, quantity: 1 }],
      success_url: envs.STRIPE_SUCCESS_URL,
      cancel_url: envs.STRIPE_CANCEL_URL,
      allow_promotion_codes: true,
      ...(params.customer_email ? { customer_email: params.customer_email } : {}),
      metadata: shared_metadata,
      subscription_data: {
        metadata: {
          plan_id: params.plan_id,
          plan_price_id: params.plan_price_id,
          plan_version_id: params.plan_version_id,
          guest: "true",
          ...(params.lead_request_id
            ? { lead_request_id: params.lead_request_id }
            : {}),
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

  async updateCustomerPreferredLocales(customer_id: string): Promise<void> {
    await this.stripe.customers.update(customer_id, {
      preferred_locales: [...STRIPE_PREFERRED_LOCALES],
    });
  }

  async updateSubscriptionMetadata(
    subscription_id: string,
    metadata: Record<string, string>,
  ): Promise<void> {
    await this.stripe.subscriptions.update(subscription_id, { metadata });
  }

  /** Cancela de inmediato en Stripe. No genera reembolso automático. */
  async cancelSubscriptionImmediately(subscription_id: string): Promise<void> {
    await this.stripe.subscriptions.cancel(subscription_id, {
      prorate: false,
    });
  }

  async createOrUpdateOneTimeProduct(params: {
    stripe_product_id?: string | null;
    title: string;
    description?: string | null;
    is_active: boolean;
    metadata: Record<string, string>;
  }): Promise<string> {
    const name = params.title?.trim();
    if (!name) {
      throw new Error(
        "El título del producto es obligatorio para sincronizar con Stripe",
      );
    }

    const description = params.description?.trim() || undefined;
    const product_payload = {
      name,
      ...(description ? { description } : {}),
      active: params.is_active,
      metadata: params.metadata,
    };

    if (params.stripe_product_id) {
      await this.stripe.products.update(
        params.stripe_product_id,
        product_payload,
      );
      return params.stripe_product_id;
    }

    const product = await this.stripe.products.create(product_payload);

    return product.id;
  }

  async createOrUpdateOneTimePrice(params: {
    stripe_product_id: string;
    stripe_price_id?: string | null;
    amount_cents: number;
    currency: string;
  }): Promise<string> {
    const currency = params.currency.toLowerCase();

    if (params.stripe_price_id) {
      try {
        const existing = await this.stripe.prices.retrieve(
          params.stripe_price_id,
        );
        if (
          existing.unit_amount === params.amount_cents &&
          existing.currency === currency &&
          existing.active
        ) {
          return params.stripe_price_id;
        }

        await this.stripe.prices.update(params.stripe_price_id, {
          active: false,
        });
      } catch {
        // El precio puede no existir ya en Stripe; se crea uno nuevo.
      }
    }

    const price = await this.stripe.prices.create({
      product: params.stripe_product_id,
      unit_amount: params.amount_cents,
      currency,
    });

    return price.id;
  }

  async createOneTimeCheckout(params: {
    customer_id: string;
    stripe_price_id: string;
    profile_id: string;
    product_kind?: string;
    product_id?: string;
    /** @deprecated Preferir product_kind + product_id */
    plan_id?: string;
    /** @deprecated Preferir product_kind + product_id */
    plan_price_id?: string;
    metadata?: Record<string, string>;
    success_url?: string;
    cancel_url?: string;
  }): Promise<string> {
    const session = await this.stripe.checkout.sessions.create({
      mode: "payment",
      locale: STRIPE_CHECKOUT_LOCALE,
      customer: params.customer_id,
      line_items: [{ price: params.stripe_price_id, quantity: 1 }],
      success_url: this.resolveCheckoutUrl(
        params.success_url,
        envs.STRIPE_SUCCESS_URL,
      ),
      cancel_url: this.resolveCheckoutUrl(
        params.cancel_url,
        envs.STRIPE_CANCEL_URL,
      ),
      allow_promotion_codes: true,
      metadata: {
        profile_id: params.profile_id,
        ...(params.product_kind ? { product_kind: params.product_kind } : {}),
        ...(params.product_id ? { product_id: params.product_id } : {}),
        ...(params.plan_id ? { plan_id: params.plan_id } : {}),
        ...(params.plan_price_id
          ? { plan_price_id: params.plan_price_id }
          : {}),
        ...(params.metadata ?? {}),
      },
    });

    if (!session.url) {
      throw new Error("Stripe no devolvió checkout_url");
    }

    return session.url;
  }

  private resolveCheckoutUrl(
    url: string | undefined,
    fallback: string,
  ): string {
    if (!url) {
      return fallback;
    }

    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    return `${envs.FRONTEND_URL}${url.startsWith("/") ? url : `/${url}`}`;
  }

  async createPortalSession(customer_id: string): Promise<string> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: customer_id,
      return_url: `${envs.FRONTEND_URL}/usuario/monetizacion`,
    });

    if (!session.url) {
      throw new Error("Stripe no devolvió portal_url");
    }

    return session.url;
  }

  async createCoupon(params: {
    name: string;
    percent_off?: number | null;
    amount_off_cents?: number | null;
    currency?: string | null;
    duration?: "once" | "repeating" | "forever";
    duration_in_months?: number | null;
  }): Promise<string> {
    const coupon = await this.stripe.coupons.create({
      name: params.name,
      duration: params.duration ?? "once",
      ...(params.duration === "repeating" && params.duration_in_months
        ? { duration_in_months: params.duration_in_months }
        : {}),
      ...(typeof params.percent_off === "number"
        ? { percent_off: params.percent_off }
        : {}),
      ...(typeof params.amount_off_cents === "number"
        ? {
            amount_off: params.amount_off_cents,
            currency: (params.currency ?? "eur").toLowerCase(),
          }
        : {}),
    });

    return coupon.id;
  }

  async createPromotionCode(params: {
    coupon_id: string;
    code: string;
    max_redemptions?: number;
    expires_at?: Date | null;
    active?: boolean;
  }): Promise<{ id: string; code: string; times_redeemed: number }> {
    const promotion_code = await this.stripe.promotionCodes.create({
      promotion: {
        type: "coupon",
        coupon: params.coupon_id,
      },
      code: params.code,
      max_redemptions: params.max_redemptions ?? 1,
      expires_at: params.expires_at
        ? Math.floor(params.expires_at.getTime() / 1000)
        : undefined,
      active: params.active ?? true,
    });

    return {
      id: promotion_code.id,
      code: promotion_code.code,
      times_redeemed: promotion_code.times_redeemed,
    };
  }

  async updatePromotionCode(
    promotion_code_id: string,
    params: { active?: boolean },
  ): Promise<{ id: string; active: boolean; times_redeemed: number }> {
    const promotion_code = await this.stripe.promotionCodes.update(
      promotion_code_id,
      {
        ...(params.active !== undefined ? { active: params.active } : {}),
      },
    );

    return {
      id: promotion_code.id,
      active: promotion_code.active,
      times_redeemed: promotion_code.times_redeemed,
    };
  }

  async retrievePromotionCode(promotion_code_id: string): Promise<{
    id: string;
    code: string;
    active: boolean;
    times_redeemed: number;
  }> {
    const promotion_code =
      await this.stripe.promotionCodes.retrieve(promotion_code_id);

    return {
      id: promotion_code.id,
      code: promotion_code.code,
      active: promotion_code.active,
      times_redeemed: promotion_code.times_redeemed,
    };
  }

  async deleteCoupon(coupon_id: string): Promise<void> {
    await this.stripe.coupons.del(coupon_id);
  }
}
