import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { envs } from "@/src/common/envs";
import { Injectable as HexInjectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { DealershipMembersEntity } from "@/src/contexts/dealership/entities/dealership-members.entity";
import { slugify } from "@/src/contexts/shared/slugify-string/slugify";
import {
  PlanEffectConfig,
  PrimitiveSubscriptionPlan,
  SubscriptionPlan,
} from "../types/subscription-plan";
import { PlanNotFoundException } from "../exceptions/billing.exceptions";
import { TypeOrmBillingProfileRepository } from "@/src/contexts/billing/repositories/typeorm.billing-support-repositories";
import { TypeOrmSubscriptionPlanRepository } from "@/src/contexts/billing/repositories/typeorm.subscription-plan-repository";
import { StripeClient } from "../clients/stripe.client";
import { BILLING_TYPE, ONE_TIME_PRODUCT_KIND, PLAN_TYPE } from "../types/billing.enums";
import { SubscriptionEntity } from "../entities/subscription.entity";
import { OneTimePurchaseEntity } from "../entities/one-time-purchase.entity";
import { ProfessionalAccountEntity } from "../entities/professional-account.entity";
import { CreateSubscriptionCheckoutHttpDto } from "../api/user/create-subscription-checkout/create-subscription-checkout.http-dto";
import { PlanVersionsService } from "./plan-versions.service";
import { AssistantCreditPacksService } from "./assistant-credit-packs.service";
import { FeaturedListingOffersService } from "./featured-listing-offers.service";
import { FREE_ENTITLEMENTS } from "../types/entitlement-features";

export interface CreatePlanPayload {
  name: string;
  description?: string | null;
  /** @deprecated */
  audience?: string | null;
  billing_type?: string;
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
  effect_config?: PlanEffectConfig | { type?: string; credits?: number };
}

export type UpdatePlanPayload = Partial<CreatePlanPayload>;

const serializePlan = (plan: SubscriptionPlan): PrimitiveSubscriptionPlan =>
  plan.toPrimitives();

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

    const plan = SubscriptionPlan.create({
      name: payload.name,
      slug,
      description: payload.description ?? null,
      audience: payload.audience ?? null,
      billing_type: BILLING_TYPE.RECURRING,
      type: PLAN_TYPE.STANDARD,
      is_active: payload.is_active ?? true,
      is_featured: payload.is_featured ?? false,
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

    const created = await this.plan_repository.create(plan);
    const plan_id = created.toPrimitives().id!;

    await this.plan_versions_service.replaceDraftEntitlements(
      plan_id,
      FREE_ENTITLEMENTS,
    );
    await this.plan_versions_service.publish(plan_id);

    return serializePlan(await this.findOneEntity(plan_id));
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
    if (payload.billing_type === BILLING_TYPE.ONE_TIME) {
      throw new BadRequestException(
        "Los productos de pago único se gestionan en Consultas del asistente o Destacar anuncios",
      );
    }

    const existing = await this.findOneEntity(id);
    const current = existing.toPrimitives();
    const next_name = payload.name ?? current.name;
    const slug =
      payload.name && payload.name !== current.name
        ? slugify(payload.name) || current.slug || id
        : current.slug ?? (slugify(current.name) || id);

    const updated = existing.applyUpdates({
      name: next_name,
      slug,
      description:
        payload.description !== undefined
          ? payload.description
          : current.description,
      audience:
        payload.audience !== undefined ? payload.audience : current.audience,
      billing_type: BILLING_TYPE.RECURRING,
      is_active: payload.is_active ?? current.is_active,
      is_featured: payload.is_featured ?? current.is_featured,
      sort_order: payload.sort_order ?? current.sort_order,
      effect_config:
        payload.effect_config !== undefined
          ? normalizeEffectConfig(payload.effect_config)
          : current.effect_config,
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
    const p = plan.toPrimitives();

    const stripe_product_id = await this.stripe_client.createOrUpdateProduct(plan);
    const price_updates: Array<{ id: string; stripe_price_id: string }> = [];

    for (const price of p.prices ?? []) {
      if (!price.id) {
        continue;
      }

      const stripe_price_id = await this.stripe_client.createOrUpdatePrice({
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

  async findCatalog(billing_type?: string) {
    const plans = await this.plan_repository.findCatalog(billing_type);

    return Promise.all(
      plans.map(async (plan) => {
        const p = plan.toPrimitives();
        const published = p.id
          ? await this.plan_versions_service.findPublishedByPlanId(p.id)
          : null;

        return {
          id: p.id,
          name: p.name,
          slug: p.slug ?? null,
          description: p.description,
          audience: p.audience ?? null,
          billing_type: p.billing_type,
          type: p.type ?? PLAN_TYPE.STANDARD,
          is_featured: p.is_featured,
          sort_order: p.sort_order,
          effect_config: p.effect_config ?? {},
          plan_version_id: published?.id ?? null,
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
          entitlements: (published?.entitlements ?? []).map((item) => ({
            feature: item.feature,
            value_type: item.value_type,
            value: item.value,
          })),
        };
      }),
    );
  }
}

@HexInjectable()
export class BillingCheckoutService {
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
  ) {}

  private async resolveCustomer(profile_id: string) {
    const profile = await this.billing_profile_repository.findById(profile_id);
    if (!profile) {
      throw new NotFoundException("Perfil no encontrado");
    }

    if (profile.stripe_customer_id) {
      await this.stripe_client.updateCustomerPreferredLocales(
        profile.stripe_customer_id,
      );
      return profile.stripe_customer_id;
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

    const plan = price.plan.toPrimitives();
    if (plan.billing_type !== BILLING_TYPE.RECURRING) {
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
    });

    return { checkout_url };
  }

  private async upsertProfessionalAccount(
    profile_id: string,
    dto: CreateSubscriptionCheckoutHttpDto,
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

    const plan = price.plan.toPrimitives();
    if (plan.billing_type !== BILLING_TYPE.ONE_TIME) {
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
    const profile = await this.billing_profile_repository.findById(profile_id);
    if (!profile?.stripe_customer_id) {
      throw new BadRequestException("No tienes un cliente de Stripe asociado");
    }

    const portal_url = await this.stripe_client.createPortalSession(
      profile.stripe_customer_id,
    );

    return { portal_url };
  }
}
