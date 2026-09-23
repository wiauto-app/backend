import {
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import Stripe from "stripe";
import { Repository } from "typeorm";

import { envs } from "@/src/common/envs";
import { Injectable as HexInjectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { DealershipMembersEntity } from "@/src/contexts/dealership/entities/dealership-members.entity";
import { slugify } from "@/src/contexts/shared/slugify-string/slugify";
import { PlanEffectConfig } from "../types/subscription-plan";
import { PlanNotFoundException } from "../exceptions/billing.exceptions";
import { TypeOrmBillingProfileRepository } from "@/src/contexts/billing/repositories/typeorm.billing-support-repositories";
import { TypeOrmSubscriptionPlanRepository } from "@/src/contexts/billing/repositories/typeorm.subscription-plan-repository";
import { TypeOrmSubscriptionRepository } from "@/src/contexts/billing/repositories/typeorm.subscription-repository";
import {
  PAYMENT_SHEET_CHECKOUT_SOURCE,
  StripeClient,
} from "../clients/stripe.client";
import {
  BILLING_TYPE,
  ONE_TIME_PRODUCT_KIND,
  PLAN_TYPE,
  PLAN_VERSION_STATUS,
} from "../types/billing.enums";
import { SubscriptionEntity } from "../entities/subscription.entity";
import { OneTimePurchaseEntity } from "../entities/one-time-purchase.entity";
import { ProfessionalAccountEntity } from "../entities/professional-account.entity";
import { SubscriptionPlanEntity } from "../entities/subscription-plan.entity";
import { CreateSubscriptionCheckoutHttpDto } from "../api/user/create-subscription-checkout/create-subscription-checkout.http-dto";
import { CreateSubscriptionPaymentSheetHttpDto } from "../api/user/create-subscription-payment-sheet/create-subscription-payment-sheet.http-dto";
import {
  ProfessionalAccountInput,
  SubscriptionPaymentSheetIntentType,
  SubscriptionPaymentSheetResult,
} from "../types/billing.types";
import { PlanVersionsService } from "./plan-versions.service";
import { AssistantCreditPacksService } from "./assistant-credit-packs.service";
import { FeaturedListingOffersService } from "./featured-listing-offers.service";
import { FREE_ENTITLEMENTS } from "../types/entitlement-features";

/** Stripe expires `incomplete` subscriptions after 23h; past that they cannot be paid. */
const INCOMPLETE_SUBSCRIPTION_TTL_SECONDS = 23 * 60 * 60;
/** Window in which repeated taps collapse into the same Stripe idempotent request. */
const PAYMENT_SHEET_IDEMPOTENCY_WINDOW_MS = 60_000;

export interface CreatePlanPayload {
  name: string;
  description?: string | null;
  /** @deprecated */
  audience?: string | null;
  billing_type?: string;
  is_active?: boolean;
  is_featured?: boolean;
  is_visible?: boolean;
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
  effect_config?: PlanEffectConfig | { type?: string; credits?: number };
}

export type UpdatePlanPayload = Partial<CreatePlanPayload>;

const normalizeEffectConfig = (
  effect_config?: PlanEffectConfig | { type?: string; credits?: number },
): PlanEffectConfig => {
  if (!effect_config?.type) {
    return {};
  }

  if (effect_config.type === "assistant_credits") {
    if (!effect_config.credits || effect_config.credits <= 0) {
      throw new BadRequestException(
        "Las consultas incluidas deben ser mayores a 0",
      );
    }

    return {
      type: "assistant_credits",
      credits: effect_config.credits,
    };
  }

  if (effect_config.type === "feature_vehicle") {
    return { type: "feature_vehicle" };
  }

  return {};
};

const pickCurrentPublishedVersion = (plan: SubscriptionPlanEntity) => {
  const published = (plan.versions ?? []).filter(
    (version) => version.status === PLAN_VERSION_STATUS.PUBLISHED,
  );
  if (!published.length) {
    return null;
  }
  return published.reduce((best, version) =>
    version.version > best.version ? version : best,
  );
};

@HexInjectable()
export class BillingPlansService {
  constructor(
    private readonly plan_repository: TypeOrmSubscriptionPlanRepository,
    private readonly stripe_client: StripeClient,
    private readonly plan_versions_service: PlanVersionsService,
    @InjectRepository(SubscriptionEntity)
    private readonly subscription_repository: Repository<SubscriptionEntity>,
    @InjectRepository(OneTimePurchaseEntity)
    private readonly one_time_purchase_repository: Repository<OneTimePurchaseEntity>,
  ) {}

  async create(payload: CreatePlanPayload) {
    if (payload.billing_type === BILLING_TYPE.ONE_TIME) {
      throw new BadRequestException(
        "Los productos de pago único se gestionan en Consultas del asistente o Destacar anuncios",
      );
    }

    const effect_config = normalizeEffectConfig(payload.effect_config);
    const slug = slugify(payload.name) || `plan-${Date.now()}`;

    const created = await this.plan_repository.create({
      name: payload.name,
      slug,
      description: payload.description ?? null,
      audience: payload.audience ?? null,
      billing_type: BILLING_TYPE.RECURRING,
      type: PLAN_TYPE.STANDARD,
      is_active: payload.is_active ?? true,
      is_featured: payload.is_featured ?? false,
      is_visible: payload.is_visible ?? true,
      sort_order: payload.sort_order ?? 0,
      effect_config,
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

    await this.plan_versions_service.replaceEntitlements(
      created.id,
      FREE_ENTITLEMENTS,
    );

    return this.findOneEntity(created.id);
  }

  async findAll(params: { page: number; limit: number; search?: string }) {
    return this.plan_repository.findAll(params);
  }

  private async findOneEntity(id: string): Promise<SubscriptionPlanEntity> {
    const plan = await this.plan_repository.findOne(id);
    if (!plan) {
      throw new NotFoundException(new PlanNotFoundException(id).message);
    }
    return plan;
  }

  async findOne(id: string) {
    return this.findOneEntity(id);
  }

  async update(id: string, payload: UpdatePlanPayload) {
    if (payload.billing_type === BILLING_TYPE.ONE_TIME) {
      throw new BadRequestException(
        "Los productos de pago único se gestionan en Consultas del asistente o Destacar anuncios",
      );
    }

    const current = await this.findOneEntity(id);
    const next_name = payload.name ?? current.name;
    const slug =
      payload.name && payload.name !== current.name
        ? slugify(payload.name) || current.slug || id
        : current.slug ?? (slugify(current.name) || id);

    return this.plan_repository.update({
      id,
      name: next_name,
      slug,
      description:
        payload.description !== undefined
          ? payload.description
          : current.description,
      audience:
        payload.audience !== undefined ? payload.audience : current.audience,
      billing_type: BILLING_TYPE.RECURRING,
      type: current.type ?? PLAN_TYPE.STANDARD,
      stripe_product_id: current.stripe_product_id,
      is_active: payload.is_active ?? current.is_active,
      is_featured: payload.is_featured ?? current.is_featured,
      is_visible: payload.is_visible ?? current.is_visible,
      sort_order: payload.sort_order ?? current.sort_order,
      effect_config:
        payload.effect_config !== undefined
          ? normalizeEffectConfig(payload.effect_config)
          : (current.effect_config as PlanEffectConfig),
      prices: payload.prices
        ? payload.prices.map((price) => ({
            interval: price.interval,
            amount_cents: price.amount_cents,
            currency: price.currency ?? "eur",
            is_active: price.is_active ?? true,
          }))
        : current.prices?.map((price) => ({
            id: price.id,
            plan_id: price.plan_id,
            interval: price.interval,
            amount_cents: price.amount_cents,
            currency: price.currency,
            stripe_price_id: price.stripe_price_id,
            is_active: price.is_active,
          })),
      features: payload.features
        ? payload.features.map((feature, index) => ({
            label: feature.label,
            description: feature.description ?? null,
            included: feature.included ?? true,
            sort_order: feature.sort_order ?? index,
          }))
        : current.features?.map((feature) => ({
            id: feature.id,
            plan_id: feature.plan_id,
            label: feature.label,
            description: feature.description,
            included: feature.included,
            sort_order: feature.sort_order,
          })),
    });
  }

  async remove(id: string) {
    await this.findOneEntity(id);

    const [subscriptions_count, purchases_count] = await Promise.all([
      this.subscription_repository.count({ where: { plan_id: id } }),
      this.one_time_purchase_repository.count({ where: { plan_id: id } }),
    ]);

    if (subscriptions_count > 0 || purchases_count > 0) {
      throw new ConflictException(
        "No se puede eliminar el plan porque tiene suscripciones o compras asociadas. Desactívalo en su lugar.",
      );
    }

    await this.plan_repository.delete(id);
  }

  async syncStripe(id: string) {
    const plan = await this.findOneEntity(id);

    const stripe_product_id = await this.stripe_client.createOrUpdateProduct(plan);
    const price_updates: Array<{ id: string; stripe_price_id: string }> = [];

    for (const price of plan.prices ?? []) {
      if (!price.id) {
        continue;
      }

      const stripe_price_id = await this.stripe_client.createOrUpdatePrice({
        stripe_product_id,
        price_id: price.stripe_price_id ?? undefined,
        amount_cents: price.amount_cents,
        currency: price.currency,
        interval: price.interval,
        billing_type: plan.billing_type,
      });

      price_updates.push({ id: price.id, stripe_price_id });
    }

    await this.plan_repository.updateStripeIds(id, stripe_product_id, price_updates);

    return this.findOneEntity(id);
  }

  async findCatalog(billing_type?: string) {
    const plans = await this.plan_repository.findCatalog(billing_type);

    return plans.map((plan) => {
      const published = pickCurrentPublishedVersion(plan);

      return {
        id: plan.id,
        name: plan.name,
        slug: plan.slug ?? null,
        description: plan.description,
        audience: plan.audience ?? null,
        billing_type: plan.billing_type,
        type: plan.type ?? PLAN_TYPE.STANDARD,
        is_featured: plan.is_featured,
        sort_order: plan.sort_order,
        effect_config: plan.effect_config ?? {},
        plan_version_id: published?.id ?? null,
        prices: (plan.prices ?? [])
          .filter((price) => price.is_active)
          .map((price) => ({
            id: price.id,
            interval: price.interval,
            amount_cents: price.amount_cents,
            currency: price.currency,
          })),
        features: (plan.features ?? []).map((feature) => ({
          id: feature.id,
          label: feature.label,
          description: feature.description ?? null,
          included: feature.included,
        })),
        entitlements: (published?.entitlements ?? []).map((item) => ({
          feature: item.feature,
          value_type: item.value_type,
          value: item.value,
        })),
      };
    });
  }
}

@HexInjectable()
export class BillingCheckoutService {
  private readonly logger = new Logger(BillingCheckoutService.name);

  constructor(
    private readonly plan_repository: TypeOrmSubscriptionPlanRepository,
    private readonly billing_profile_repository: TypeOrmBillingProfileRepository,
    private readonly stripe_client: StripeClient,
    private readonly plan_versions_service: PlanVersionsService,
    private readonly assistant_credit_packs_service: AssistantCreditPacksService,
    private readonly featured_listing_offers_service: FeaturedListingOffersService,
    @InjectRepository(DealershipMembersEntity)
    private readonly dealership_members_repository: Repository<DealershipMembersEntity>,
    @InjectRepository(ProfessionalAccountEntity)
    private readonly professional_account_repository: Repository<ProfessionalAccountEntity>,
    private readonly subscription_repository: TypeOrmSubscriptionRepository,
  ) {}

  private isStripeResourceMissing(error: unknown): boolean {
    const stripe_error = error as { code?: string; statusCode?: number };
    return (
      stripe_error.code === "resource_missing" ||
      stripe_error.statusCode === 404
    );
  }

  private async resolveCustomer(profile_id: string) {
    const profile = await this.billing_profile_repository.findById(profile_id);
    if (!profile) {
      throw new NotFoundException("Perfil no encontrado");
    }

    if (profile.stripe_customer_id) {
      try {
        await this.stripe_client.updateCustomerPreferredLocales(
          profile.stripe_customer_id,
        );
        return profile.stripe_customer_id;
      } catch (error) {
        if (!this.isStripeResourceMissing(error)) {
          throw error;
        }

        this.logger.warn(
          `Customer Stripe ${profile.stripe_customer_id} no existe en esta cuenta; se recreará para el perfil ${profile_id}`,
        );
      }
    }

    const customer_id = await this.stripe_client.createCustomer({
      email: profile.email,
      name: profile.name,
      profile_id: profile.id,
    });

    await this.billing_profile_repository.updateStripeCustomerId(
      profile_id,
      customer_id,
    );
    return customer_id;
  }

  private async resolveRecurringPrice(plan_price_id: string) {
    const price = await this.plan_repository.findPriceById(plan_price_id);
    if (!price?.stripe_price_id) {
      throw new BadRequestException("El precio no está sincronizado con Stripe");
    }

    if (price.plan.billing_type !== BILLING_TYPE.RECURRING) {
      throw new BadRequestException("El plan no es de suscripción recurrente");
    }

    return price;
  }

  private async resolveDealershipId(
    profile_id: string,
  ): Promise<string | undefined> {
    const membership = await this.dealership_members_repository.findOne({
      where: { profile_id },
    });
    return membership?.dealership_id;
  }

  async createPublicSubscriptionCheckout(
    profile_id: string | undefined,
    plan_price_id: string,
  ) {
    await this.resolveRecurringPrice(plan_price_id);

    if (profile_id) {
      return this.createLegacySubscriptionCheckout(profile_id, plan_price_id);
    }

    return this.createGuestSubscriptionCheckout(plan_price_id);
  }

  async createSubscriptionCheckout(
    profile_id: string,
    dto: CreateSubscriptionCheckoutHttpDto,
  ) {
    const price = await this.resolveRecurringPrice(dto.plan_price_id);
    const published = await this.plan_versions_service.findPublishedByPlanId(
      price.plan_id,
    );
    if (!published) {
      throw new BadRequestException(
        "El plan no tiene una versión publicada de entitlements",
      );
    }

    const professional_account = await this.upsertProfessionalAccount(
      profile_id,
      dto,
    );
    const dealership_id = await this.resolveDealershipId(profile_id);
    const customer_id = await this.resolveCustomer(profile_id);
    const checkout_url = await this.stripe_client.createSubscriptionCheckout({
      customer_id,
      stripe_price_id: price.stripe_price_id!,
      profile_id,
      plan_id: price.plan_id,
      plan_price_id: dto.plan_price_id,
      plan_version_id: published.id,
      dealership_id,
      professional_account_id: professional_account.id,
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
      success_url: `${envs.FRONTEND_URL}/billing-plan/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${envs.FRONTEND_URL}/billing-plan?plan_price_id=${dto.plan_price_id}`,
    });

    return { checkout_url };
  }

  /**
   * Native PaymentSheet flow (mobile). Creates the Stripe subscription in
   * `incomplete` state and returns the secrets the SDK needs to confirm it.
   * It does NOT write the local subscription row: the webhook is the source of
   * truth and the client polls GET /v1/billing/me afterwards.
   * Promotion codes are not supported in v1.
   */
  async createSubscriptionPaymentSheet(
    profile_id: string,
    dto: CreateSubscriptionPaymentSheetHttpDto,
  ): Promise<SubscriptionPaymentSheetResult> {
    const price = await this.resolveRecurringPrice(dto.plan_price_id);
    const published = await this.plan_versions_service.findPublishedByPlanId(
      price.plan_id,
    );
    if (!published) {
      throw new BadRequestException(
        "El plan no tiene una versión publicada de entitlements",
      );
    }

    // Plan changes on a live subscription go through the customer portal, not
    // through a second subscription.
    const live_subscriptions =
      await this.subscription_repository.findCancellableByProfileId(profile_id);
    if (live_subscriptions.length > 0) {
      throw new ConflictException(
        "Ya tienes una suscripción activa; gestiona el cambio de plan desde tu suscripción",
      );
    }

    const professional_account = await this.upsertProfessionalAccount(
      profile_id,
      dto,
    );
    const dealership_id = await this.resolveDealershipId(profile_id);
    const customer_id = await this.resolveCustomer(profile_id);

    try {
      await this.stripe_client.updateCustomerBillingProfile(customer_id, {
        name: dto.legal_name,
        phone: `${dto.phone_code} ${dto.phone}`.trim(),
        address: {
          line1: dto.billing_address.line1,
          line2: dto.billing_address.line2,
          city: dto.billing_address.city,
          state: dto.billing_address.state,
          postal_code: dto.billing_address.postal_code,
          country: dto.billing_address.country,
        },
        tax_id: dto.tax_id,
        account_type: dto.account_type,
      });
    } catch (error) {
      throw this.mapPaymentSheetStripeError(error);
    }

    await this.linkProfessionalAccountToCustomer(
      professional_account,
      customer_id,
    );

    const subscription = await this.resolvePaymentSheetSubscription({
      profile_id,
      customer_id,
      stripe_price_id: price.stripe_price_id!,
      plan_id: price.plan_id,
      plan_price_id: dto.plan_price_id,
      plan_version_id: published.id,
      professional_account_id: professional_account.id,
      dealership_id,
    });

    const { intent_type, client_secret } =
      this.extractPaymentSheetIntent(subscription);
    const customer_session_client_secret =
      await this.stripe_client.createCustomerSession({ customer_id });

    return {
      intent_type,
      client_secret,
      customer_session_client_secret,
      customer_id,
      subscription_id: subscription.id,
    };
  }

  /**
   * Reuses a still-payable incomplete PaymentSheet subscription of the same
   * price (retry after the user dismissed the sheet) and cancels the rest, so a
   * customer never accumulates several pending subscriptions.
   */
  private async resolvePaymentSheetSubscription(params: {
    profile_id: string;
    customer_id: string;
    stripe_price_id: string;
    plan_id: string;
    plan_price_id: string;
    plan_version_id: string;
    professional_account_id: string;
    dealership_id?: string;
  }): Promise<Stripe.Subscription> {
    const incomplete = (
      await this.stripe_client.listIncompleteSubscriptions(params.customer_id)
    ).filter(
      // Ignore incomplete subscriptions not created by this flow (e.g. Checkout).
      (item) => item.metadata?.checkout_source === PAYMENT_SHEET_CHECKOUT_SOURCE,
    );

    const now_seconds = Math.floor(Date.now() / 1000);
    const canceled_ids: string[] = [];
    let reusable: Stripe.Subscription | null = null;

    for (const candidate of incomplete) {
      if (
        !reusable &&
        this.isFreshSubscriptionForPrice(
          candidate,
          params.stripe_price_id,
          now_seconds,
        )
      ) {
        const detailed =
          await this.stripe_client.retrieveSubscriptionForPaymentSheet(
            candidate.id,
          );
        if (this.hasPayableIntent(detailed)) {
          reusable = detailed;
          continue;
        }
      }

      await this.cancelStaleIncompleteSubscription(candidate.id);
      canceled_ids.push(candidate.id);
    }

    if (reusable) {
      return reusable;
    }

    try {
      return await this.stripe_client.createSubscriptionForPaymentSheet({
        customer_id: params.customer_id,
        stripe_price_id: params.stripe_price_id,
        profile_id: params.profile_id,
        plan_id: params.plan_id,
        plan_price_id: params.plan_price_id,
        plan_version_id: params.plan_version_id,
        professional_account_id: params.professional_account_id,
        dealership_id: params.dealership_id,
        idempotency_key: this.buildPaymentSheetIdempotencyKey(
          params.profile_id,
          params.plan_price_id,
          canceled_ids,
        ),
      });
    } catch (error) {
      throw this.mapPaymentSheetStripeError(error);
    }
  }

  /**
   * Stripe replays the cached response for an idempotency key during 24h, even if
   * that subscription was canceled or expired meanwhile. So the key is scoped to
   * a short time window (collapses double taps) and includes the ids of the
   * subscriptions canceled in this request (a legitimate retry after a cancel
   * always gets a fresh key).
   */
  private buildPaymentSheetIdempotencyKey(
    profile_id: string,
    plan_price_id: string,
    canceled_ids: string[],
  ): string {
    const window = Math.floor(Date.now() / PAYMENT_SHEET_IDEMPOTENCY_WINDOW_MS);
    const canceled_suffix = canceled_ids.length
      ? `:after:${canceled_ids.join(",")}`
      : "";

    return `sub-ps:${profile_id}:${plan_price_id}:${window}${canceled_suffix}`;
  }

  private isFreshSubscriptionForPrice(
    subscription: Stripe.Subscription,
    stripe_price_id: string,
    now_seconds: number,
  ): boolean {
    const price = subscription.items.data[0]?.price;
    const price_id = typeof price === "string" ? price : price?.id;

    return (
      price_id === stripe_price_id &&
      now_seconds - subscription.created < INCOMPLETE_SUBSCRIPTION_TTL_SECONDS
    );
  }

  /** True when the (expanded) subscription still has an intent the SDK can confirm. */
  private hasPayableIntent(subscription: Stripe.Subscription): boolean {
    const invoice = subscription.latest_invoice;
    if (
      invoice &&
      typeof invoice !== "string" &&
      invoice.status === "open" &&
      invoice.confirmation_secret?.client_secret
    ) {
      return true;
    }

    const setup_intent = subscription.pending_setup_intent;
    return Boolean(
      setup_intent &&
        typeof setup_intent !== "string" &&
        setup_intent.client_secret &&
        setup_intent.status !== "succeeded" &&
        setup_intent.status !== "canceled",
    );
  }

  private extractPaymentSheetIntent(subscription: Stripe.Subscription): {
    intent_type: SubscriptionPaymentSheetIntentType;
    client_secret: string | null;
  } {
    const invoice = subscription.latest_invoice;
    const payment_secret =
      invoice && typeof invoice !== "string"
        ? invoice.confirmation_secret?.client_secret
        : undefined;
    if (payment_secret) {
      return { intent_type: "payment", client_secret: payment_secret };
    }

    const setup_intent = subscription.pending_setup_intent;
    const setup_secret =
      setup_intent && typeof setup_intent !== "string"
        ? setup_intent.client_secret
        : undefined;
    if (setup_secret) {
      // Total is 0 (trial / 100% discount): only the payment method is saved.
      return { intent_type: "setup", client_secret: setup_secret };
    }

    return { intent_type: "none", client_secret: null };
  }

  private async cancelStaleIncompleteSubscription(
    subscription_id: string,
  ): Promise<void> {
    try {
      await this.stripe_client.cancelSubscriptionImmediately(subscription_id);
    } catch (error) {
      if (!this.isStripeErrorCode(error, "resource_missing")) {
        throw error;
      }
      this.logger.warn(
        `Suscripción incompleta ${subscription_id} ya no existe en Stripe`,
      );
    }
  }

  private async linkProfessionalAccountToCustomer(
    account: ProfessionalAccountEntity,
    stripe_customer_id: string,
  ): Promise<void> {
    if (account.stripe_customer_id === stripe_customer_id) {
      return;
    }

    const preloaded = await this.professional_account_repository.preload({
      id: account.id,
      stripe_customer_id,
    });

    if (preloaded) {
      await this.professional_account_repository.save(preloaded);
    }
  }

  /** Translates known Stripe errors into user-facing HTTP errors; others pass through. */
  private mapPaymentSheetStripeError(error: unknown): unknown {
    if (this.isStripeErrorCode(error, "customer_tax_location_invalid")) {
      return new BadRequestException(
        "No pudimos validar tu dirección de facturación. Revisa los datos e inténtalo de nuevo",
      );
    }

    if (this.isStripeErrorCode(error, "idempotency_key_in_use")) {
      return new ConflictException(
        "Estamos procesando tu solicitud; inténtalo de nuevo en unos segundos",
      );
    }

    return error;
  }

  private isStripeErrorCode(error: unknown, code: string): boolean {
    return (error as { code?: string } | null)?.code === code;
  }

  private async createLegacySubscriptionCheckout(
    profile_id: string,
    plan_price_id: string,
  ) {
    const price = await this.resolveRecurringPrice(plan_price_id);
    const published = await this.plan_versions_service.findPublishedByPlanId(
      price.plan_id,
    );
    if (!published) {
      throw new BadRequestException(
        "El plan no tiene una versión publicada de entitlements",
      );
    }

    const dealership_id = await this.resolveDealershipId(profile_id);
    const customer_id = await this.resolveCustomer(profile_id);
    const checkout_url = await this.stripe_client.createSubscriptionCheckout({
      customer_id,
      stripe_price_id: price.stripe_price_id!,
      profile_id,
      plan_id: price.plan_id,
      plan_price_id,
      plan_version_id: published.id,
      dealership_id,
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
    });

    return { checkout_url };
  }

  private async upsertProfessionalAccount(
    profile_id: string,
    dto: ProfessionalAccountInput,
  ): Promise<ProfessionalAccountEntity> {
    const existing = await this.professional_account_repository.findOne({
      where: { profile_id },
    });

    const commercial_name = dto.commercial_name ?? null;
    const accepted_terms_at = new Date();

    if (existing) {
      const preloaded = await this.professional_account_repository.preload({
        id: existing.id,
        type: dto.account_type,
        legal_name: dto.legal_name,
        commercial_name,
        tax_id: dto.tax_id,
        email: dto.email,
        phone_code: dto.phone_code,
        phone: dto.phone,
        accepted_terms_at,
      });

      if (!preloaded) {
        throw new BadRequestException("No se pudo actualizar la cuenta profesional");
      }

      return this.professional_account_repository.save(preloaded);
    }

    const created = this.professional_account_repository.create({
      profile_id,
      type: dto.account_type,
      legal_name: dto.legal_name,
      commercial_name,
      tax_id: dto.tax_id,
      email: dto.email,
      phone_code: dto.phone_code,
      phone: dto.phone,
      accepted_terms_at,
    });

    return this.professional_account_repository.save(created);
  }

  private async createGuestSubscriptionCheckout(plan_price_id: string) {
    const price = await this.resolveRecurringPrice(plan_price_id);
    const published = await this.plan_versions_service.findPublishedByPlanId(
      price.plan_id,
    );
    if (!published) {
      throw new BadRequestException(
        "El plan no tiene una versión publicada de entitlements",
      );
    }

    const checkout_url = await this.stripe_client.createGuestSubscriptionCheckout({
      stripe_price_id: price.stripe_price_id!,
      plan_id: price.plan_id,
      plan_price_id,
      plan_version_id: published.id,
    });

    return { checkout_url };
  }

  async createOneTimeCheckout(
    profile_id: string,
    params: {
      pack_id?: string;
      offer_id?: string;
      /** @deprecated Preferir pack_id u offer_id */
      plan_price_id?: string;
      metadata?: Record<string, string>;
      success_url?: string;
      cancel_url?: string;
    },
  ) {
    const selected = [params.pack_id, params.offer_id, params.plan_price_id].filter(
      Boolean,
    );
    if (selected.length !== 1) {
      throw new BadRequestException(
        "Debes indicar exactamente uno de: pack_id, offer_id o plan_price_id",
      );
    }

    const customer_id = await this.resolveCustomer(profile_id);

    if (params.pack_id) {
      const pack = await this.assistant_credit_packs_service.findOne(
        params.pack_id,
      );
      if (!pack.is_active) {
        throw new BadRequestException("El pack no está activo");
      }
      if (!pack.stripe_price_id) {
        throw new BadRequestException(
          "El pack no está sincronizado con Stripe",
        );
      }

      const checkout_url = await this.stripe_client.createOneTimeCheckout({
        customer_id,
        stripe_price_id: pack.stripe_price_id,
        profile_id,
        product_kind: ONE_TIME_PRODUCT_KIND.ASSISTANT_CREDIT_PACK,
        product_id: pack.id,
        metadata: params.metadata,
        success_url: params.success_url,
        cancel_url: params.cancel_url,
      });

      return { checkout_url };
    }

    if (params.offer_id) {
      const offer = await this.featured_listing_offers_service.findOne(
        params.offer_id,
      );
      if (!offer.is_active) {
        throw new BadRequestException("La oferta no está activa");
      }
      if (!offer.stripe_price_id) {
        throw new BadRequestException(
          "La oferta no está sincronizada con Stripe",
        );
      }

      const vehicle_id = params.metadata?.vehicle_id;
      if (!vehicle_id) {
        throw new BadRequestException(
          "Debes indicar vehicle_id en metadata para destacar un anuncio",
        );
      }

      const checkout_url = await this.stripe_client.createOneTimeCheckout({
        customer_id,
        stripe_price_id: offer.stripe_price_id,
        profile_id,
        product_kind: ONE_TIME_PRODUCT_KIND.FEATURED_LISTING_OFFER,
        product_id: offer.id,
        metadata: params.metadata,
        success_url: params.success_url,
        cancel_url: params.cancel_url,
      });

      return { checkout_url };
    }

    const plan_price_id = params.plan_price_id!;
    const price = await this.plan_repository.findPriceById(plan_price_id);
    if (!price?.stripe_price_id) {
      throw new BadRequestException("El precio no está sincronizado con Stripe");
    }

    if (price.plan.billing_type !== BILLING_TYPE.ONE_TIME) {
      throw new BadRequestException("El plan no es de pago único");
    }

    const checkout_url = await this.stripe_client.createOneTimeCheckout({
      customer_id,
      stripe_price_id: price.stripe_price_id,
      profile_id,
      plan_id: price.plan_id,
      plan_price_id,
      metadata: params.metadata,
      success_url: params.success_url,
      cancel_url: params.cancel_url,
    });

    return { checkout_url };
  }

  async createPortalSession(profile_id: string) {
    const customer_id = await this.resolveCustomer(profile_id);
    const portal_url =
      await this.stripe_client.createPortalSession(customer_id);

    return { portal_url };
  }
}
