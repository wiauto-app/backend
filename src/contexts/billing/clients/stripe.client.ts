import { Logger } from "@nestjs/common";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import Stripe from "stripe";

import { envs } from "@/src/common/envs";
import {
  BILLING_TYPE,
  PRICE_INTERVAL,
  PROFESSIONAL_ACCOUNT_TYPE,
  ProfessionalAccountType,
} from "../types/billing.enums";
import { SubscriptionPlanEntity } from "../entities/subscription-plan.entity";

export const STRIPE_PREFERRED_LOCALES = ["es"] as const;
export const STRIPE_CHECKOUT_LOCALE = "es";
/** Value of `subscription.metadata.checkout_source` for native PaymentSheet subscriptions. */
export const PAYMENT_SHEET_CHECKOUT_SOURCE = "payment_sheet";

// VAT prefixes accepted by Stripe `eu_vat` (Greece uses EL, Northern Ireland XI).
const EU_VAT_PREFIXES = new Set([
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "EL", "ES", "FI", "FR",
  "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO",
  "SE", "SI", "SK", "XI",
]);

/**
 * Maps the fiscal id typed by the user to a Stripe tax id type.
 * - Value with an EU country prefix (e.g. ESB12345678) -> eu_vat.
 * - Spanish company without prefix -> es_cif.
 * - Anything else (e.g. a DNI/NIE of a self-employed person) is not attached to
 *   the Stripe customer; it is still stored in professional_accounts.
 */
export const resolveStripeTaxId = (params: {
  tax_id: string;
  country: string;
  account_type: ProfessionalAccountType;
}): { type: "eu_vat" | "es_cif"; value: string } | null => {
  const value = params.tax_id.replace(/[\s.-]/g, "").toUpperCase();
  if (!value) {
    return null;
  }

  if (
    /^[A-Z]{2}[A-Z0-9]{2,12}$/.test(value) &&
    EU_VAT_PREFIXES.has(value.slice(0, 2))
  ) {
    return { type: "eu_vat", value };
  }

  if (
    params.country === "ES" &&
    params.account_type === PROFESSIONAL_ACCOUNT_TYPE.COMPANY
  ) {
    return { type: "es_cif", value };
  }

  return null;
};

@Injectable()
export class StripeClient {
  private readonly logger = new Logger(StripeClient.name);
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

  async createOrUpdateProduct(plan: SubscriptionPlanEntity): Promise<string> {
    if (plan.stripe_product_id) {
      try {
        await this.stripe.products.update(plan.stripe_product_id, {
          name: plan.name,
          description: plan.description ?? undefined,
          active: plan.is_active,
          metadata: {
            plan_id: plan.id,
            billing_type: plan.billing_type,
          },
        });
        return plan.stripe_product_id;
      } catch (error) {
        if (!this.isResourceMissing(error)) {
          throw error;
        }
        // El product_id guardado no existe en estas credenciales de Stripe
        // (cuenta/entorno distinto) — se crea uno nuevo en su lugar.
      }
    }

    const product = await this.stripe.products.create({
      name: plan.name,
      description: plan.description ?? undefined,
      active: plan.is_active,
      metadata: {
        plan_id: plan.id,
        billing_type: plan.billing_type,
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
      try {
        await this.stripe.prices.update(params.price_id, { active: true });
        return params.price_id;
      } catch (error) {
        if (!this.isResourceMissing(error)) {
          throw error;
        }
        // El price_id guardado no existe en estas credenciales de Stripe
        // (cuenta/entorno distinto) — se crea uno nuevo en su lugar.
      }
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
      tax_behavior: "exclusive",
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
      automatic_tax: { enabled: true },
      billing_address_collection: params.billing_address_collection ?? "required",
      customer_update: { address: "auto", name: "auto" },
      ...(params.tax_id_collection
        ? { tax_id_collection: params.tax_id_collection }
        : {}),
      metadata: shared_metadata,
      subscription_data: {
        metadata: {
          profile_id: params.profile_id,
          plan_id: params.plan_id,
          plan_price_id: params.plan_price_id,
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

  /**
   * Native PaymentSheet flow: creates the subscription in `incomplete` state so
   * the mobile SDK can confirm the first invoice (or the setup intent when the
   * total is 0). Metadata lives on the SUBSCRIPTION because the webhook reads it
   * from there. Promotion codes are not supported in v1.
   */
  async createSubscriptionForPaymentSheet(params: {
    customer_id: string;
    stripe_price_id: string;
    profile_id: string;
    plan_id: string;
    plan_price_id: string;
    plan_version_id: string;
    professional_account_id: string;
    dealership_id?: string;
    idempotency_key: string;
  }): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.create(
      {
        customer: params.customer_id,
        items: [{ price: params.stripe_price_id }],
        payment_behavior: "default_incomplete",
        payment_settings: {
          save_default_payment_method: "on_subscription",
          payment_method_types: ["card"],
        },
        automatic_tax: { enabled: true },
        expand: ["latest_invoice.confirmation_secret", "pending_setup_intent"],
        metadata: {
          profile_id: params.profile_id,
          plan_id: params.plan_id,
          plan_price_id: params.plan_price_id,
          plan_version_id: params.plan_version_id,
          professional_account_id: params.professional_account_id,
          // Lets the webhook tell PaymentSheet subscriptions apart from Checkout.
          checkout_source: PAYMENT_SHEET_CHECKOUT_SOURCE,
          ...(params.dealership_id
            ? { dealership_id: params.dealership_id }
            : {}),
        },
      },
      { idempotencyKey: params.idempotency_key },
    );
  }

  /** Incomplete subscriptions of a customer (Stripe auto-expires them after 23h). */
  async listIncompleteSubscriptions(
    customer_id: string,
  ): Promise<Stripe.Subscription[]> {
    const subscriptions = await this.stripe.subscriptions.list({
      customer: customer_id,
      status: "incomplete",
      limit: 20,
    });

    return subscriptions.data;
  }

  async retrieveSubscriptionForPaymentSheet(
    subscription_id: string,
  ): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.retrieve(subscription_id, {
      expand: ["latest_invoice.confirmation_secret", "pending_setup_intent"],
    });
  }

  /**
   * Native PaymentSheet flow for one-time products. Metadata lives on the
   * PAYMENT INTENT because `payment_intent.succeeded` reads it from there.
   * No automatic tax: `amount_cents` is charged as-is.
   */
  async createOneTimePaymentIntent(params: {
    amount_cents: number;
    currency: string;
    customer_id: string;
    description: string;
    metadata: Record<string, string>;
    idempotency_key: string;
  }): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.create(
      {
        amount: params.amount_cents,
        currency: params.currency,
        customer: params.customer_id,
        automatic_payment_methods: { enabled: true, allow_redirects: "never" },
        description: params.description,
        metadata: params.metadata,
      },
      { idempotencyKey: params.idempotency_key },
    );
  }

  /** Customer Session for the mobile Payment Element (saved payment methods). */
  async createCustomerSession(params: { customer_id: string }): Promise<string> {
    const session = await this.stripe.customerSessions.create({
      customer: params.customer_id,
      components: {
        mobile_payment_element: {
          enabled: true,
          features: {
            payment_method_save: "enabled",
            payment_method_redisplay: "enabled",
            payment_method_remove: "enabled",
          },
        },
      },
    });

    return session.client_secret;
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
      automatic_tax: { enabled: true },
      billing_address_collection: "required",
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

  /**
   * Syncs fiscal data to the Stripe customer for the native flow (no Checkout
   * to collect it). The address update validates the tax location right away and
   * throws `customer_tax_location_invalid` when Stripe Tax cannot resolve it.
   * The tax id is best-effort: it never blocks the subscription.
   */
  async updateCustomerBillingProfile(
    customer_id: string,
    params: {
      name: string;
      phone: string;
      address: {
        line1: string;
        line2?: string;
        city: string;
        state?: string;
        postal_code: string;
        country: string;
      };
      tax_id: string;
      account_type: ProfessionalAccountType;
    },
  ): Promise<void> {
    await this.stripe.customers.update(customer_id, {
      name: params.name,
      phone: params.phone,
      address: {
        line1: params.address.line1,
        ...(params.address.line2 ? { line2: params.address.line2 } : {}),
        city: params.address.city,
        ...(params.address.state ? { state: params.address.state } : {}),
        postal_code: params.address.postal_code,
        country: params.address.country,
      },
      tax: { validate_location: "immediately" },
    });

    await this.attachCustomerTaxIdBestEffort(customer_id, {
      tax_id: params.tax_id,
      country: params.address.country,
      account_type: params.account_type,
    });
  }

  private async attachCustomerTaxIdBestEffort(
    customer_id: string,
    params: {
      tax_id: string;
      country: string;
      account_type: ProfessionalAccountType;
    },
  ): Promise<void> {
    const resolved = resolveStripeTaxId(params);
    if (!resolved) {
      return;
    }

    try {
      const existing = await this.stripe.customers.listTaxIds(customer_id, {
        limit: 100,
      });
      const already_attached = existing.data.some(
        (tax_id) =>
          tax_id.type === resolved.type &&
          tax_id.value.toUpperCase() === resolved.value,
      );
      if (already_attached) {
        return;
      }

      await this.stripe.customers.createTaxId(customer_id, resolved);
    } catch (error) {
      // tax_id_invalid (or any other failure) must not block the purchase; the
      // value is still persisted locally in professional_accounts.
      const stripe_error = error as { code?: string; message?: string };
      this.logger.warn(
        `No se pudo asociar el tax id al customer ${customer_id} (${stripe_error.code ?? "unknown"}): ${stripe_error.message ?? ""}`,
      );
    }
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
      try {
        await this.stripe.products.update(
          params.stripe_product_id,
          product_payload,
        );
        return params.stripe_product_id;
      } catch (error) {
        if (!this.isResourceMissing(error)) {
          throw error;
        }
        // El product_id guardado no existe en estas credenciales de Stripe
        // (cuenta/entorno distinto) — se crea uno nuevo en su lugar.
      }
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
      tax_behavior: "exclusive",
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
      automatic_tax: { enabled: true },
      billing_address_collection: "required",
      customer_update: { address: "auto" },
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

  private isResourceMissing(error: unknown): boolean {
    const stripe_error = error as { code?: string; statusCode?: number };
    return (
      stripe_error.code === "resource_missing" ||
      stripe_error.statusCode === 404
    );
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
