import { ForbiddenException } from "@nestjs/common";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { DealershipEntity } from "@/src/contexts/dealership/entities/dealership.entity";
import { DealershipMembersEntity } from "@/src/contexts/dealership/entities/dealership-members.entity";
import { Roles } from "@/src/contexts/roles/entities/roles.entity";
import { TypeOrmVehicleRepository } from "@/src/contexts/vehicles/repositories/typeorm.vehicle-repository";
import { TypeOrmBillingProfileRepository } from "@/src/contexts/billing/repositories/typeorm.billing-support-repositories";
import { TypeOrmSubscriptionRepository } from "@/src/contexts/billing/repositories/typeorm.subscription-repository";
import { BillingMeSummary, ResolvedEntitlements } from "../types/billing.types";
import { FREE_PLAN_QUOTAS, normalizePlanQuotas } from "../types/plan-quotas";

@Injectable()
export class EntitlementsService {
  constructor(
    private readonly billing_profile_repository: TypeOrmBillingProfileRepository,
    private readonly subscription_repository: TypeOrmSubscriptionRepository,
    private readonly vehicle_repository: TypeOrmVehicleRepository,
    @InjectRepository(Roles)
    private readonly roles_repository: Repository<Roles>,
    @InjectRepository(DealershipMembersEntity)
    private readonly dealership_members_repository: Repository<DealershipMembersEntity>,
    @InjectRepository(DealershipEntity)
    private readonly dealership_repository: Repository<DealershipEntity>,
  ) {}

  async resolve(profile_id: string): Promise<ResolvedEntitlements> {
    const membership = await this.dealership_members_repository.findOne({
      where: { profile_id },
    });

    if (membership) {
      const dealership = await this.dealership_repository.findOne({
        where: { id: membership.dealership_id },
      });

      if (dealership) {
        const member_profile_ids = await this.getDealershipMemberProfileIds(
          membership.dealership_id,
        );
        const listings_used =
          await this.vehicle_repository.count_active_by_profile_ids(
            member_profile_ids,
          );

        return {
          quotas: normalizePlanQuotas({
            max_listings: dealership.max_listings,
            max_photos: dealership.max_photos,
            allow_videos: dealership.allow_videos,
          }),
          source: "dealership",
          plan_id: dealership.billing_plan_id ?? null,
          plan_name: null,
          dealership_id: membership.dealership_id,
          listings_used,
          listings_scope: "dealership",
          is_unlimited: false,
        };
      }
    }

    const profile = await this.billing_profile_repository.findById(profile_id);
    if (profile?.role_id) {
      const role = await this.roles_repository.findOne({
        where: { id: profile.role_id },
      });
      if (role?.is_admin || role?.is_developer) {
        const listings_used =
          await this.vehicle_repository.count_active_by_profile_id(profile_id);
        return {
          quotas: {
            max_listings: Number.MAX_SAFE_INTEGER,
            max_photos: Number.MAX_SAFE_INTEGER,
            allow_videos: true,
          },
          source: "free",
          plan_id: null,
          plan_name: null,
          dealership_id: null,
          listings_used,
          listings_scope: "profile",
          is_unlimited: true,
        };
      }
    }

    const listings_used =
      await this.vehicle_repository.count_active_by_profile_id(profile_id);

    return {
      quotas: { ...FREE_PLAN_QUOTAS },
      source: "free",
      plan_id: null,
      plan_name: null,
      dealership_id: null,
      listings_used,
      listings_scope: "profile",
      is_unlimited: false,
    };
  }

  async getBillingMe(profile_id: string): Promise<BillingMeSummary> {
    const profile = await this.billing_profile_repository.findById(profile_id);
    const subscription =
      await this.subscription_repository.findActiveByProfileId(profile_id);
    const entitlements = await this.resolve(profile_id);

    let effective_role: BillingMeSummary["effective_role"] = null;
    if (profile?.role_id) {
      const role = await this.roles_repository.findOne({
        where: { id: profile.role_id },
      });
      if (role) {
        effective_role = { id: role.id, name: role.name };
      }
    }

    return {
      subscription: subscription
        ? {
            id: subscription.id,
            plan_id: subscription.plan_id,
            plan_name: subscription.plan_name,
            status: subscription.status,
            current_period_end: subscription.current_period_end,
            cancel_at_period_end: subscription.cancel_at_period_end,
          }
        : null,
      effective_role,
      vehicle_listings_used: entitlements.listings_used,
      vehicle_listings_max: entitlements.is_unlimited
        ? null
        : entitlements.quotas.max_listings,
      quotas: entitlements.quotas,
      usage: {
        listings_used: entitlements.listings_used,
        listings_scope: entitlements.listings_scope,
        dealership_id: entitlements.dealership_id,
      },
      source: entitlements.source,
      plan_id: entitlements.plan_id,
      stripe_customer_id: profile?.stripe_customer_id ?? null,
    };
  }

  async assertCanCreateListing(profile_id: string): Promise<ResolvedEntitlements> {
    const entitlements = await this.resolve(profile_id);
    if (entitlements.is_unlimited) {
      return entitlements;
    }

    if (entitlements.listings_used >= entitlements.quotas.max_listings) {
      throw new ForbiddenException(
        `Has alcanzado el límite de anuncios activos (${entitlements.quotas.max_listings}).`,
      );
    }

    return entitlements;
  }

  async assertCanAddPhotos(
    profile_id: string,
    current_photo_count: number,
    adding_count: number,
  ): Promise<void> {
    const entitlements = await this.resolve(profile_id);
    if (entitlements.is_unlimited) {
      return;
    }

    if (current_photo_count + adding_count > entitlements.quotas.max_photos) {
      throw new ForbiddenException(
        `Puedes añadir un máximo de ${entitlements.quotas.max_photos} fotos por anuncio.`,
      );
    }
  }

  async assertCanUploadVideos(profile_id: string): Promise<void> {
    const entitlements = await this.resolve(profile_id);
    if (entitlements.is_unlimited) {
      return;
    }

    if (!entitlements.quotas.allow_videos) {
      throw new ForbiddenException(
        "Tu cuenta no incluye vídeos en los anuncios.",
      );
    }
  }

  async getDefaultRoleId(): Promise<string | null> {
    const role = await this.roles_repository.findOne({
      where: { is_default: true },
    });

    return role?.id ?? null;
  }

  private async getDealershipMemberProfileIds(
    dealership_id: string,
  ): Promise<string[]> {
    const members = await this.dealership_members_repository.find({
      where: { dealership_id },
      select: { profile_id: true },
    });
    return members.map((member) => member.profile_id);
  }
}
