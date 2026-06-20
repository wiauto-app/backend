import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { PermissionKeys } from "@/src/contexts/users/permissions/lib/available-permission";
import { Roles } from "@/src/contexts/roles/entities/roles.entity";
import { VehicleRepository } from "@/src/contexts/vehicles/domain/repositories/vehicle.repository";
import { BillingProfileRepository } from "../../domain/repositories/billing.repositories";
import { SubscriptionRepository } from "../../domain/repositories/billing.repositories";
import { BillingMeSummary } from "../../domain/repositories/billing.repositories";

@Injectable()
export class EntitlementsService {
  constructor(
    private readonly billing_profile_repository: BillingProfileRepository,
    private readonly subscription_repository: SubscriptionRepository,
    private readonly vehicle_repository: VehicleRepository,
    @InjectRepository(Roles)
    private readonly roles_repository: Repository<Roles>,
  ) {}

  async getBillingMe(profile_id: string): Promise<BillingMeSummary> {
    const profile = await this.billing_profile_repository.findById(profile_id);
    const subscription = await this.subscription_repository.findActiveByProfileId(profile_id);
    const vehicle_listings_used =
      await this.vehicle_repository.count_active_by_profile_id(profile_id);

    let effective_role: BillingMeSummary["effective_role"] = null;
    let vehicle_listings_max: number | null = null;

    if (profile?.role_id) {
      const role = await this.roles_repository.findOne({
        where: { id: profile.role_id },
        relations: { roles_permissions: { permission: true } },
      });

      if (role) {
        effective_role = { id: role.id, name: role.name };

        if (!role.is_admin && !role.is_developer) {
          const quota = role.roles_permissions.find(
            (rp) => rp.permission.key === PermissionKeys.VEHICLES_CREATE,
          );
          vehicle_listings_max =
            typeof quota?.permission.value === "number" ? quota.permission.value : null;
        }
      }
    }

    return {
      subscription: subscription
        ? {
            id: subscription.id,
            plan_id: subscription.plan_id,
            plan_name: subscription.plan_name,
            plan_slug: subscription.plan_slug,
            status: subscription.status,
            current_period_end: subscription.current_period_end,
            cancel_at_period_end: subscription.cancel_at_period_end,
          }
        : null,
      effective_role,
      vehicle_listings_used,
      vehicle_listings_max,
      stripe_customer_id: profile?.stripe_customer_id ?? null,
    };
  }

  async getDefaultRoleId(): Promise<string | null> {
    const role = await this.roles_repository.findOne({
      where: { is_default: true },
    });

    return role?.id ?? null;
  }
}
