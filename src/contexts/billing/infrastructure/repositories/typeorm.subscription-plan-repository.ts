import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";

import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { getSkip } from "@/src/contexts/shared/getSkip";
import {
  PrimitivePlanFeature,
  PrimitivePlanPrice,
  PrimitiveSubscriptionPlan,
  SubscriptionPlan,
} from "../../domain/entities/subscription-plan";
import { SubscriptionPlanRepository } from "../../domain/repositories/billing.repositories";
import { PlanFeatureEntity } from "../persistence/plan-feature.entity";
import { SubscriptionPlanPriceEntity } from "../persistence/subscription-plan-price.entity";
import { SubscriptionPlanEntity } from "../persistence/subscription-plan.entity";

const entity_to_plan = (entity: SubscriptionPlanEntity): SubscriptionPlan =>
  SubscriptionPlan.fromPrimitives({
    id: entity.id,
    slug: entity.slug,
    name: entity.name,
    description: entity.description,
    audience: entity.audience,
    billing_type: entity.billing_type,
    role_id: entity.role_id,
    stripe_product_id: entity.stripe_product_id,
    is_active: entity.is_active,
    is_featured: entity.is_featured,
    sort_order: entity.sort_order,
    effect_config: (entity.effect_config ?? {}) as PrimitiveSubscriptionPlan["effect_config"],
    created_at: entity.created_at,
    updated_at: entity.updated_at,
    prices: entity.prices?.map((price) => ({
      id: price.id,
      plan_id: price.plan_id,
      interval: price.interval,
      amount_cents: price.amount_cents,
      currency: price.currency,
      stripe_price_id: price.stripe_price_id,
      is_active: price.is_active,
    })),
    features: entity.features?.map((feature) => ({
      id: feature.id,
      plan_id: feature.plan_id,
      label: feature.label,
      description: feature.description,
      included: feature.included,
      sort_order: feature.sort_order,
    })),
  });

@Injectable()
export class TypeOrmSubscriptionPlanRepository extends SubscriptionPlanRepository {
  constructor(
    @InjectRepository(SubscriptionPlanEntity)
    private readonly plan_repository: Repository<SubscriptionPlanEntity>,
    @InjectRepository(SubscriptionPlanPriceEntity)
    private readonly price_repository: Repository<SubscriptionPlanPriceEntity>,
    @InjectRepository(PlanFeatureEntity)
    private readonly feature_repository: Repository<PlanFeatureEntity>,
  ) {
    super();
  }

  async create(plan: SubscriptionPlan): Promise<SubscriptionPlan> {
    const p = plan.toPrimitives();
    const saved = await this.plan_repository.save({
      slug: p.slug,
      name: p.name,
      description: p.description ?? null,
      audience: p.audience as SubscriptionPlanEntity["audience"],
      billing_type: p.billing_type as SubscriptionPlanEntity["billing_type"],
      role_id: p.role_id ?? null,
      stripe_product_id: p.stripe_product_id ?? null,
      is_active: p.is_active,
      is_featured: p.is_featured,
      sort_order: p.sort_order,
      effect_config: (p.effect_config ?? {}) as Record<string, unknown>,
    });

    if (p.prices?.length) {
      await this.savePrices(saved.id, p.prices);
    }
    if (p.features?.length) {
      await this.saveFeatures(saved.id, p.features);
    }

    return (await this.findOne(saved.id)) as SubscriptionPlan;
  }

  async update(plan: SubscriptionPlan): Promise<SubscriptionPlan> {
    const p = plan.toPrimitives();
    const preloaded = await this.plan_repository.preload({
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description ?? null,
      audience: p.audience as SubscriptionPlanEntity["audience"],
      billing_type: p.billing_type as SubscriptionPlanEntity["billing_type"],
      role_id: p.role_id ?? null,
      stripe_product_id: p.stripe_product_id ?? null,
      is_active: p.is_active,
      is_featured: p.is_featured,
      sort_order: p.sort_order,
      effect_config: (p.effect_config ?? {}) as Record<string, unknown>,
    });

    if (!preloaded) {
      throw new Error("Plan no encontrado");
    }

    await this.plan_repository.save(preloaded);

    if (p.prices) {
      await this.savePrices(preloaded.id, p.prices);
    }
    if (p.features) {
      await this.saveFeatures(preloaded.id, p.features);
    }

    return (await this.findOne(preloaded.id)) as SubscriptionPlan;
  }

  async delete(id: string): Promise<void> {
    await this.plan_repository.delete(id);
  }

  async findOne(id: string): Promise<SubscriptionPlan | null> {
    const entity = await this.plan_repository.findOne({
      where: { id },
      relations: { prices: true, features: true },
    });

    return entity ? entity_to_plan(entity) : null;
  }

  async findBySlug(slug: string): Promise<SubscriptionPlan | null> {
    const entity = await this.plan_repository.findOne({
      where: { slug },
      relations: { prices: true, features: true },
    });

    return entity ? entity_to_plan(entity) : null;
  }

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<PaginatedResult<SubscriptionPlan>> {
    const skip = getSkip(params.page, params.limit);
    const where = params.search
      ? [{ name: ILike(`%${params.search}%`) }, { slug: ILike(`%${params.search}%`) }]
      : undefined;

    const [rows, total] = await this.plan_repository.findAndCount({
      where,
      relations: { prices: true, features: true },
      order: { sort_order: "ASC", name: "ASC" },
      skip,
      take: params.limit,
    });

    return new PaginatedResult(
      rows.map(entity_to_plan),
      total,
      params.page,
      params.limit,
    );
  }

  async findCatalog(audience?: string): Promise<SubscriptionPlan[]> {
    const rows = await this.plan_repository.find({
      where: {
        is_active: true,
        ...(audience ? { audience: audience as SubscriptionPlanEntity["audience"] } : {}),
      },
      relations: { prices: true, features: true },
      order: { sort_order: "ASC", name: "ASC" },
    });

    return rows.map(entity_to_plan);
  }

  async savePrices(plan_id: string, prices: PrimitivePlanPrice[]): Promise<void> {
    await this.price_repository.delete({ plan_id });

    if (!prices.length) {
      return;
    }

    await this.price_repository.save(
      prices.map((price) => ({
        plan_id,
        interval: price.interval as SubscriptionPlanPriceEntity["interval"],
        amount_cents: price.amount_cents,
        currency: price.currency ?? "eur",
        stripe_price_id: price.stripe_price_id ?? null,
        is_active: price.is_active ?? true,
      })),
    );
  }

  async saveFeatures(plan_id: string, features: PrimitivePlanFeature[]): Promise<void> {
    await this.feature_repository.delete({ plan_id });

    if (!features.length) {
      return;
    }

    await this.feature_repository.save(
      features.map((feature, index) => ({
        plan_id,
        label: feature.label,
        description: feature.description ?? null,
        included: feature.included ?? true,
        sort_order: feature.sort_order ?? index,
      })),
    );
  }

  async findPriceById(price_id: string) {
    const price = await this.price_repository.findOne({
      where: { id: price_id, is_active: true },
      relations: { plan: { prices: true, features: true } },
    });

    if (!price?.plan) {
      return null;
    }

    return {
      id: price.id,
      plan_id: price.plan_id,
      stripe_price_id: price.stripe_price_id,
      interval: price.interval,
      amount_cents: price.amount_cents,
      currency: price.currency,
      is_active: price.is_active,
      plan: entity_to_plan(price.plan),
    };
  }

  async updateStripeIds(
    plan_id: string,
    stripe_product_id: string,
    price_updates: Array<{ id: string; stripe_price_id: string }>,
  ): Promise<void> {
    const preloaded = await this.plan_repository.preload({
      id: plan_id,
      stripe_product_id,
    });

    if (preloaded) {
      await this.plan_repository.save(preloaded);
    }

    for (const update of price_updates) {
      const price = await this.price_repository.preload({
        id: update.id,
        stripe_price_id: update.stripe_price_id,
      });
      if (price) {
        await this.price_repository.save(price);
      }
    }
  }
}
