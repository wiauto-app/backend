import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { getSkip } from "@/src/contexts/shared/getSkip";
import { SUBSCRIPTION_STATUS } from "../../domain/enums/billing.enums";
import { SubscriptionRepository } from "../../domain/repositories/billing.repositories";
import { SubscriptionEntity } from "../persistence/subscription.entity";

@Injectable()
export class TypeOrmSubscriptionRepository extends SubscriptionRepository {
  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly subscription_repository: Repository<SubscriptionEntity>,
  ) {
    super();
  }

  async upsert(data: {
    profile_id: string;
    plan_id: string;
    stripe_customer_id: string;
    stripe_subscription_id: string;
    status: string;
    current_period_start: Date | null;
    current_period_end: Date | null;
    cancel_at_period_end: boolean;
  }): Promise<void> {
    const existing = await this.subscription_repository.findOne({
      where: { stripe_subscription_id: data.stripe_subscription_id },
    });

    if (existing) {
      const preloaded = await this.subscription_repository.preload({
        id: existing.id,
        profile_id: data.profile_id,
        plan_id: data.plan_id,
        stripe_customer_id: data.stripe_customer_id,
        status: data.status as SubscriptionEntity["status"],
        current_period_start: data.current_period_start,
        current_period_end: data.current_period_end,
        cancel_at_period_end: data.cancel_at_period_end,
      });

      if (preloaded) {
        await this.subscription_repository.save(preloaded);
      }
      return;
    }

    await this.subscription_repository.save({
      profile_id: data.profile_id,
      plan_id: data.plan_id,
      stripe_customer_id: data.stripe_customer_id,
      stripe_subscription_id: data.stripe_subscription_id,
      status: data.status as SubscriptionEntity["status"],
      current_period_start: data.current_period_start,
      current_period_end: data.current_period_end,
      cancel_at_period_end: data.cancel_at_period_end,
    });
  }

  async findActiveByProfileId(profile_id: string) {
    const row = await this.subscription_repository.findOne({
      where: {
        profile_id,
        status: SUBSCRIPTION_STATUS.ACTIVE,
      },
      relations: { plan: true },
      order: { created_at: "DESC" },
    });

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      plan_id: row.plan_id,
      status: row.status,
      current_period_end: row.current_period_end,
      cancel_at_period_end: row.cancel_at_period_end,
      plan_name: row.plan.name,
      plan_slug: row.plan.slug,
    };
  }

  async findByStripeSubscriptionId(stripe_subscription_id: string) {
    const row = await this.subscription_repository.findOne({
      where: { stripe_subscription_id },
    });

    if (!row) {
      return null;
    }

    return {
      cancel_at_period_end: row.cancel_at_period_end,
    };
  }

  async findAllAdmin(params: { page: number; limit: number }) {
    const skip = getSkip(params.page, params.limit);
    const [rows, total] = await this.subscription_repository.findAndCount({
      relations: { plan: true, profile: true },
      order: { created_at: "DESC" },
      skip,
      take: params.limit,
    });

    return new PaginatedResult(
      rows.map((row) => ({
        id: row.id,
        profile_id: row.profile_id,
        plan_id: row.plan_id,
        plan_name: row.plan.name,
        status: row.status,
        stripe_subscription_id: row.stripe_subscription_id,
        current_period_end: row.current_period_end,
        cancel_at_period_end: row.cancel_at_period_end,
        created_at: row.created_at,
      })),
      total,
      params.page,
      params.limit,
    );
  }
}
