import { NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { SubscriptionEntitlementOverrideEntity } from "../entities/subscription-entitlement-override.entity";
import { SubscriptionEntity } from "../entities/subscription.entity";
import {
  EntitlementValue,
  EntitlementValueType,
} from "../types/entitlement-features";

export interface OverrideInput {
  feature: string;
  value_type: EntitlementValueType;
  value: EntitlementValue;
}

@Injectable()
export class SubscriptionOverridesService {
  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly subscription_repository: Repository<SubscriptionEntity>,
    @InjectRepository(SubscriptionEntitlementOverrideEntity)
    private readonly override_repository: Repository<SubscriptionEntitlementOverrideEntity>,
  ) {}

  async list(subscription_id: string) {
    await this.ensureSubscription(subscription_id);
    return this.override_repository.find({
      where: { subscription_id },
      order: { feature: "ASC" },
    });
  }

  async replace(subscription_id: string, overrides: OverrideInput[]) {
    await this.ensureSubscription(subscription_id);
    await this.override_repository.delete({ subscription_id });

    for (const override of overrides) {
      await this.override_repository.save({
        subscription_id,
        feature: override.feature,
        value_type: override.value_type,
        value: override.value,
      });
    }

    return this.list(subscription_id);
  }

  async copyProposedOverrides(
    subscription_id: string,
    overrides: OverrideInput[],
  ) {
    if (!overrides.length) {
      return;
    }
    await this.replace(subscription_id, overrides);
  }

  private async ensureSubscription(subscription_id: string) {
    const subscription = await this.subscription_repository.findOne({
      where: { id: subscription_id },
    });
    if (!subscription) {
      throw new NotFoundException("Suscripción no encontrada");
    }
    return subscription;
  }
}
