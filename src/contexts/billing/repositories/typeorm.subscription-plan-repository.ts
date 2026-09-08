import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";

import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { getSkip } from "@/src/contexts/shared/getSkip";
import {
  CreateSubscriptionPlanData,
  PlanFeatureInput,
  PlanPriceInput,
  UpdateSubscriptionPlanData,
} from "../types/subscription-plan";
import { PLAN_VERSION_STATUS } from "../types/billing.enums";
import { PlanFeatureEntity } from "../entities/plan-feature.entity";
import { SubscriptionPlanPriceEntity } from "../entities/subscription-plan-price.entity";
import { SubscriptionPlanEntity } from "../entities/subscription-plan.entity";

@Injectable()
export class TypeOrmSubscriptionPlanRepository {
  constructor(
    @InjectRepository(SubscriptionPlanEntity)
    private readonly plan_repository: Repository<SubscriptionPlanEntity>,
    @InjectRepository(SubscriptionPlanPriceEntity)
    private readonly price_repository: Repository<SubscriptionPlanPriceEntity>,
    @InjectRepository(PlanFeatureEntity)
    private readonly feature_repository: Repository<PlanFeatureEntity>,
  ) {}

  async create(data: CreateSubscriptionPlanData): Promise<SubscriptionPlanEntity> {
    const saved = await this.plan_repository.save({
      name: data.name,
      slug: data.slug ?? null,
      description: data.description ?? null,
      audience: (data.audience ?? null) as SubscriptionPlanEntity["audience"],
      billing_type: data.billing_type as SubscriptionPlanEntity["billing_type"],
      type: (data.type ?? "standard") as SubscriptionPlanEntity["type"],
      stripe_product_id: data.stripe_product_id ?? null,
      is_active: data.is_active,
      is_featured: data.is_featured,
      sort_order: data.sort_order,
      effect_config: (data.effect_config ?? {}) as Record<string, unknown>,
    });

    if (data.prices?.length) {
      await this.savePrices(saved.id, data.prices);
    }
    if (data.features?.length) {
      await this.saveFeatures(saved.id, data.features);
    }

    return (await this.findOne(saved.id)) as SubscriptionPlanEntity;
  }

  async update(data: UpdateSubscriptionPlanData): Promise<SubscriptionPlanEntity> {
    const preloaded = await this.plan_repository.preload({
      id: data.id,
      name: data.name,
      slug: data.slug ?? null,
      description: data.description ?? null,
      audience: (data.audience ?? null) as SubscriptionPlanEntity["audience"],
      billing_type: data.billing_type as SubscriptionPlanEntity["billing_type"],
      type: (data.type ?? "standard") as SubscriptionPlanEntity["type"],
      stripe_product_id: data.stripe_product_id ?? null,
      is_active: data.is_active,
      is_featured: data.is_featured,
      sort_order: data.sort_order,
      effect_config: (data.effect_config ?? {}) as Record<string, unknown>,
    });

    if (!preloaded) {
      throw new Error("Plan no encontrado");
    }

    await this.plan_repository.save(preloaded);

    if (data.prices) {
      await this.savePrices(preloaded.id, data.prices);
    }
    if (data.features) {
      await this.saveFeatures(preloaded.id, data.features);
    }

    return (await this.findOne(preloaded.id)) as SubscriptionPlanEntity;
  }

  async delete(id: string): Promise<void> {
    await this.plan_repository.delete(id);
  }

  async findOne(id: string): Promise<SubscriptionPlanEntity | null> {
    return this.plan_repository.findOne({
      where: { id },
      relations: { prices: true, features: true },
    });
  }

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<PaginatedResult<SubscriptionPlanEntity>> {
    const skip = getSkip(params.page, params.limit);
    const where = params.search
      ? { name: ILike(`%${params.search}%`) }
      : undefined;

    const [rows, total] = await this.plan_repository.findAndCount({
      where,
      relations: { prices: true, features: true },
      order: { sort_order: "ASC", name: "ASC" },
      skip,
      take: params.limit,
    });

    return new PaginatedResult(rows, total, params.page, params.limit);
  }

  /**
   * Catálogo activo con prices, features y versión published + entitlements en un solo join.
   */
  async findCatalog(billing_type?: string): Promise<SubscriptionPlanEntity[]> {
    const qb = this.plan_repository
      .createQueryBuilder("plan")
      .leftJoinAndSelect("plan.prices", "prices")
      .leftJoinAndSelect("plan.features", "features")
      .leftJoinAndSelect(
        "plan.versions",
        "versions",
        "versions.status = :published_status",
        { published_status: PLAN_VERSION_STATUS.PUBLISHED },
      )
      .leftJoinAndSelect("versions.entitlements", "entitlements")
      .where("plan.is_active = :is_active", { is_active: true })
      .orderBy("plan.sort_order", "ASC")
      .addOrderBy("plan.name", "ASC");

    if (billing_type) {
      qb.andWhere("plan.billing_type = :billing_type", { billing_type });
    }

    return qb.getMany();
  }

  async savePrices(plan_id: string, prices: PlanPriceInput[]): Promise<void> {
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

  async saveFeatures(
    plan_id: string,
    features: PlanFeatureInput[],
  ): Promise<void> {
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
      plan: price.plan,
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
