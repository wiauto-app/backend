import { ForbiddenException } from "@nestjs/common";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { DealershipMembersEntity } from "@/src/contexts/dealership/entities/dealership-members.entity";
import { TypeOrmVehicleRepository } from "@/src/contexts/vehicles/repositories/typeorm.vehicle-repository";
import { TypeOrmBillingProfileRepository } from "@/src/contexts/billing/repositories/typeorm.billing-support-repositories";
import { TypeOrmSubscriptionRepository } from "@/src/contexts/billing/repositories/typeorm.subscription-repository";
import { PlanEntitlementEntity } from "../entities/plan-entitlement.entity";
import { SubscriptionEntitlementOverrideEntity } from "../entities/subscription-entitlement-override.entity";
import { SubscriptionUsageEntity } from "../entities/subscription-usage.entity";
import { SUBSCRIPTION_STATUS } from "../types/billing.enums";
import {
  ENTITLEMENT_FEATURE,
  isMeteredFeature,
} from "../types/entitlement-features";
import {
  BillingMeSummary,
  ResolvedEntitlements,
  UsageCheckResult,
  buildFreeEntitlementsMap,
  buildUnlimitedEntitlementsMap,
  definitionFromRow,
  getBooleanFromEntitlement,
  getLimitFromEntitlement,
  mergeEntitlements,
  toBillingMeEntitlementEntry,
  toLegacyQuotas,
} from "../types/entitlement-resolve";
import { SubscriptionEntity } from "../entities/subscription.entity";
import { PlanAccessGrantEntity } from "../entities/plan-access-grant.entity";
import { PlanAccessGrantUsageEntity } from "../entities/plan-access-grant-usage.entity";
import { PlanAccessGrantsService } from "./plan-access-grants.service";

@Injectable()
export class EntitlementsService {
  constructor(
    private readonly billing_profile_repository: TypeOrmBillingProfileRepository,
    private readonly subscription_repository: TypeOrmSubscriptionRepository,
    private readonly plan_access_grants_service: PlanAccessGrantsService,
    private readonly vehicle_repository: TypeOrmVehicleRepository,
    @InjectRepository(DealershipMembersEntity)
    private readonly dealership_members_repository: Repository<DealershipMembersEntity>,
    @InjectRepository(SubscriptionEntity)
    private readonly subscription_entity_repository: Repository<SubscriptionEntity>,
    @InjectRepository(PlanEntitlementEntity)
    private readonly plan_entitlement_repository: Repository<PlanEntitlementEntity>,
    @InjectRepository(SubscriptionEntitlementOverrideEntity)
    private readonly override_repository: Repository<SubscriptionEntitlementOverrideEntity>,
    @InjectRepository(SubscriptionUsageEntity)
    private readonly usage_repository: Repository<SubscriptionUsageEntity>,
    @InjectRepository(PlanAccessGrantUsageEntity)
    private readonly grant_usage_repository: Repository<PlanAccessGrantUsageEntity>,
    @InjectRepository(PlanAccessGrantEntity)
    private readonly grant_repository: Repository<PlanAccessGrantEntity>,
  ) {}

  async resolve(profile_id: string): Promise<ResolvedEntitlements> {
    const profile = await this.billing_profile_repository.findById(profile_id);
    if (profile?.is_admin) {
      const listings_used =
        await this.vehicle_repository.count_active_by_profile_id(profile_id);
      const features = buildUnlimitedEntitlementsMap();
      return {
        features,
        source: "admin",
        plan_id: null,
        plan_name: null,
        plan_version_id: null,
        subscription_id: null,
        access_grant_id: null,
        dealership_id: null,
        listings_used,
        listings_scope: "profile",
        is_unlimited: true,
        quotas: toLegacyQuotas(features),
      };
    }

    const own_subscription =
      await this.findActiveSubscriptionWithPlan(profile_id);

    if (own_subscription?.plan_version_id) {
      return this.resolveFromSubscription(own_subscription, "subscription");
    }

    const own_grant =
      await this.plan_access_grants_service.findActiveByProfileId(profile_id);
    if (own_grant) {
      return this.resolveFromGrant(own_grant, "admin_grant");
    }

    const membership = await this.dealership_members_repository.findOne({
      where: { profile_id },
    });

    if (membership) {
      const owner = await this.dealership_members_repository.findOne({
        where: {
          dealership_id: membership.dealership_id,
          role: "owner",
        },
      });

      if (owner && owner.profile_id !== profile_id) {
        const owner_subscription = await this.findActiveSubscriptionWithPlan(
          owner.profile_id,
        );
        if (owner_subscription?.plan_version_id) {
          return this.resolveFromSubscription(
            owner_subscription,
            "dealership_owner",
            membership.dealership_id,
          );
        }

        const owner_grant =
          await this.plan_access_grants_service.findActiveByProfileId(
            owner.profile_id,
          );
        if (owner_grant) {
          return this.resolveFromGrant(
            owner_grant,
            "dealership_owner",
            membership.dealership_id,
          );
        }
      }

      if (own_subscription?.plan_version_id) {
        return this.resolveFromSubscription(
          own_subscription,
          "subscription",
          membership.dealership_id,
        );
      }
    }

    const listings_used =
      await this.countListingsForProfile(profile_id, membership?.dealership_id);
    const features = buildFreeEntitlementsMap();
    return {
      features,
      source: "free",
      plan_id: null,
      plan_name: null,
      plan_version_id: null,
      subscription_id: null,
      access_grant_id: null,
      dealership_id: membership?.dealership_id ?? null,
      listings_used,
      listings_scope: membership ? "dealership" : "profile",
      is_unlimited: false,
      quotas: toLegacyQuotas(features),
    };
  }

  async has(profile_id: string, feature: string): Promise<boolean> {
    const resolved = await this.resolve(profile_id);
    if (resolved.is_unlimited) {
      return true;
    }
    return getBooleanFromEntitlement(resolved.features[feature]);
  }

  async getLimit(profile_id: string, feature: string): Promise<number | null> {
    const resolved = await this.resolve(profile_id);
    if (resolved.is_unlimited) {
      return null;
    }
    return getLimitFromEntitlement(resolved.features[feature]);
  }

  async checkUsage(
    profile_id: string,
    feature: string,
  ): Promise<UsageCheckResult> {
    const resolved = await this.resolve(profile_id);
    const limit = resolved.is_unlimited
      ? null
      : getLimitFromEntitlement(resolved.features[feature]);

    let used = 0;
    if (feature === ENTITLEMENT_FEATURE.VEHICLES) {
      used = resolved.listings_used;
    } else if (isMeteredFeature(feature)) {
      used = await this.getResolvedMeteredUsed(resolved, feature);
    }

    const remaining = limit === null ? null : Math.max(limit - used, 0);
    return {
      feature,
      used,
      limit,
      remaining,
      allowed: limit === null || used < limit,
    };
  }

  async assertCanCreateListing(profile_id: string): Promise<ResolvedEntitlements> {
    const resolved = await this.resolve(profile_id);
    if (resolved.is_unlimited) {
      return resolved;
    }

    const limit = getLimitFromEntitlement(
      resolved.features[ENTITLEMENT_FEATURE.VEHICLES],
    );
    if (limit !== null && resolved.listings_used >= limit) {
      throw new ForbiddenException(
        `Has alcanzado el límite de anuncios activos (${limit}).`,
      );
    }

    return resolved;
  }

  async assertCanAddPhotos(
    profile_id: string,
    current_photo_count: number,
    adding_count: number,
  ): Promise<void> {
    const resolved = await this.resolve(profile_id);
    if (resolved.is_unlimited) {
      return;
    }

    const limit = getLimitFromEntitlement(
      resolved.features[ENTITLEMENT_FEATURE.PHOTOS_PER_VEHICLE],
    );
    if (limit !== null && current_photo_count + adding_count > limit) {
      throw new ForbiddenException(
        `Puedes añadir un máximo de ${limit} fotos por anuncio.`,
      );
    }
  }

  async assertCanUploadVideos(profile_id: string): Promise<void> {
    const resolved = await this.resolve(profile_id);
    if (resolved.is_unlimited) {
      return;
    }

    if (
      !getBooleanFromEntitlement(
        resolved.features[ENTITLEMENT_FEATURE.VIDEO_UPLOAD],
      )
    ) {
      throw new ForbiddenException(
        "Tu cuenta no incluye vídeos en los anuncios.",
      );
    }
  }

  async assertCanUseAi(profile_id: string): Promise<void> {
    const check = await this.checkUsage(
      profile_id,
      ENTITLEMENT_FEATURE.AI_REQUESTS,
    );
    if (!check.allowed) {
      throw new ForbiddenException(
        "Has alcanzado el límite de consultas de IA de tu plan.",
      );
    }
  }

  async incrementMeteredUsage(
    profile_id: string,
    feature: string,
    amount = 1,
  ): Promise<void> {
    if (!isMeteredFeature(feature)) {
      return;
    }

    const resolved = await this.resolve(profile_id);
    if (resolved.is_unlimited) {
      return;
    }

    if (resolved.access_grant_id) {
      await this.incrementGrantMeteredUsage(
        resolved.access_grant_id,
        feature,
        amount,
      );
      return;
    }
    if (!resolved.subscription_id) {
      return;
    }

    const subscription = await this.subscription_entity_repository.findOne({
      where: { id: resolved.subscription_id },
    });
    if (!subscription?.current_period_start || !subscription.current_period_end) {
      return;
    }

    const existing = await this.usage_repository.findOne({
      where: {
        subscription_id: subscription.id,
        feature,
        period_start: subscription.current_period_start,
      },
    });

    if (existing) {
      const preloaded = await this.usage_repository.preload({
        id: existing.id,
        used: existing.used + amount,
      });
      if (preloaded) {
        await this.usage_repository.save(preloaded);
      }
      return;
    }

    await this.usage_repository.save({
      subscription_id: subscription.id,
      feature,
      period_start: subscription.current_period_start,
      period_end: subscription.current_period_end,
      used: amount,
    });
  }

  async rotateUsagePeriod(
    subscription_id: string,
    period_start: Date,
    period_end: Date,
  ): Promise<void> {
    const metered_features = [ENTITLEMENT_FEATURE.AI_REQUESTS];
    for (const feature of metered_features) {
      const existing = await this.usage_repository.findOne({
        where: {
          subscription_id,
          feature,
          period_start,
        },
      });
      if (existing) {
        continue;
      }
      await this.usage_repository.save({
        subscription_id,
        feature,
        period_start,
        period_end,
        used: 0,
      });
    }
  }

  async getBillingMe(profile_id: string): Promise<BillingMeSummary> {
    const profile = await this.billing_profile_repository.findById(profile_id);
    const subscription =
      await this.subscription_repository.findActiveByProfileId(profile_id);
    const entitlements = await this.resolve(profile_id);

    const entitlements_map: BillingMeSummary["entitlements"] = {};
    for (const [feature, entitlement] of Object.entries(entitlements.features)) {
      let used: number | undefined;
      if (feature === ENTITLEMENT_FEATURE.VEHICLES) {
        used = entitlements.listings_used;
      } else if (isMeteredFeature(feature)) {
        used = await this.getResolvedMeteredUsed(entitlements, feature);
      }
      entitlements_map[feature] = toBillingMeEntitlementEntry(entitlement, used);
    }

    const vehicles_limit = getLimitFromEntitlement(
      entitlements.features[ENTITLEMENT_FEATURE.VEHICLES],
    );
    const grant = entitlements.access_grant_id
      ? await this.grant_repository.findOne({
          where: { id: entitlements.access_grant_id },
        })
      : null;
    const access_grant =
      grant &&
      entitlements.plan_id &&
      entitlements.plan_name &&
      entitlements.plan_version_id
        ? {
            id: grant.id,
            plan_id: entitlements.plan_id,
            plan_name: entitlements.plan_name,
            plan_version_id: entitlements.plan_version_id,
            expires_at: grant.expires_at,
          }
        : null;

    return {
      subscription: subscription
        ? {
            id: subscription.id,
            plan_id: subscription.plan_id,
            plan_name: subscription.plan_name,
            plan_version_id: subscription.plan_version_id,
            status: subscription.status,
            current_period_end: subscription.current_period_end,
            cancel_at_period_end: subscription.cancel_at_period_end,
          }
        : null,
      access_grant,
      entitlements: entitlements_map,
      vehicle_listings_used: entitlements.listings_used,
      vehicle_listings_max: entitlements.is_unlimited ? null : vehicles_limit,
      quotas: entitlements.quotas,
      usage: {
        listings_used: entitlements.listings_used,
        listings_scope: entitlements.listings_scope,
        dealership_id: entitlements.dealership_id,
      },
      source: entitlements.source,
      plan_id: entitlements.plan_id,
      plan_name: entitlements.plan_name,
      stripe_customer_id: profile?.stripe_customer_id ?? null,
    };
  }

  async getEntitlementsForVersion(plan_version_id: string) {
    const rows = await this.plan_entitlement_repository.find({
      where: { plan_version_id },
    });
    return rows.map((row) => ({
      feature: row.feature,
      value_type: row.value_type,
      value: row.value,
    }));
  }

  private async resolveFromSubscription(
    subscription: SubscriptionEntity & {
      plan?: { name: string };
    },
    source: "subscription" | "dealership_owner",
    dealership_id?: string | null,
  ): Promise<ResolvedEntitlements> {
    if (!subscription.plan_version_id) {
      throw new Error("La suscripción activa no tiene una versión de plan");
    }
    const base_rows = await this.plan_entitlement_repository.find({
      where: { plan_version_id: subscription.plan_version_id },
    });
    const override_rows = await this.override_repository.find({
      where: { subscription_id: subscription.id },
    });

    const clean = mergeEntitlements(
      base_rows.length > 0
        ? base_rows.map((row) => definitionFromRow(row))
        : Object.values(buildFreeEntitlementsMap()).map((item) =>
            definitionFromRow(item),
          ),
      override_rows.map((row) => definitionFromRow(row)),
      base_rows.length > 0 ? "plan_version" : "free",
    );

    for (const [key, free_item] of Object.entries(buildFreeEntitlementsMap())) {
      if (!(key in clean)) {
        clean[key] = free_item;
      }
    }

    const membership = await this.dealership_members_repository.findOne({
      where: { profile_id: subscription.profile_id },
    });
    const membership_dealership_id =
      dealership_id ?? membership?.dealership_id ?? null;

    const listings_used = await this.countListingsForProfile(
      subscription.profile_id,
      membership_dealership_id,
    );

    return {
      features: clean,
      source,
      plan_id: subscription.plan_id,
      plan_name: subscription.plan.name,
      plan_version_id: subscription.plan_version_id,
      subscription_id: subscription.id,
      access_grant_id: null,
      dealership_id: membership_dealership_id,
      listings_used,
      listings_scope: membership_dealership_id ? "dealership" : "profile",
      is_unlimited: false,
      quotas: toLegacyQuotas(clean),
    };
  }

  private async resolveFromGrant(
    grant: PlanAccessGrantEntity & { plan?: { name: string } },
    source: "admin_grant" | "dealership_owner",
    dealership_id?: string | null,
  ): Promise<ResolvedEntitlements> {
    const base_rows = await this.plan_entitlement_repository.find({
      where: { plan_version_id: grant.plan_version_id },
    });
    const clean = mergeEntitlements(
      base_rows.length > 0
        ? base_rows.map((row) => definitionFromRow(row))
        : Object.values(buildFreeEntitlementsMap()).map((item) =>
            definitionFromRow(item),
          ),
      [],
      base_rows.length > 0 ? "plan_version" : "free",
    );

    for (const [key, free_item] of Object.entries(buildFreeEntitlementsMap())) {
      if (!(key in clean)) {
        clean[key] = free_item;
      }
    }

    const membership = await this.dealership_members_repository.findOne({
      where: { profile_id: grant.profile_id },
    });
    const membership_dealership_id =
      dealership_id ?? membership?.dealership_id ?? null;
    const listings_used = await this.countListingsForProfile(
      grant.profile_id,
      membership_dealership_id,
    );

    return {
      features: clean,
      source,
      plan_id: grant.plan_id,
      plan_name: grant.plan.name,
      plan_version_id: grant.plan_version_id,
      subscription_id: null,
      access_grant_id: grant.id,
      dealership_id: membership_dealership_id,
      listings_used,
      listings_scope: membership_dealership_id ? "dealership" : "profile",
      is_unlimited: false,
      quotas: toLegacyQuotas(clean),
    };
  }

  private async findActiveSubscriptionWithPlan(profile_id: string) {
    return this.subscription_entity_repository.findOne({
      where: {
        profile_id,
        status: In([
          SUBSCRIPTION_STATUS.ACTIVE,
          SUBSCRIPTION_STATUS.TRIALING,
        ]),
      },
      relations: { plan: true },
      order: { created_at: "DESC" },
    });
  }

  private async countListingsForProfile(
    profile_id: string,
    dealership_id?: string | null,
  ): Promise<number> {
    if (dealership_id) {
      const members = await this.dealership_members_repository.find({
        where: { dealership_id },
        select: { profile_id: true },
      });
      return this.vehicle_repository.count_active_by_profile_ids(
        members.map((member) => member.profile_id),
      );
    }

    return this.vehicle_repository.count_active_by_profile_id(profile_id);
  }

  private async getMeteredUsed(
    subscription_id: string,
    feature: string,
    resolved: ResolvedEntitlements,
  ): Promise<number> {
    const subscription = await this.subscription_entity_repository.findOne({
      where: { id: subscription_id },
    });
    if (!subscription?.current_period_start) {
      return 0;
    }

    const row = await this.usage_repository.findOne({
      where: {
        subscription_id,
        feature,
        period_start: subscription.current_period_start,
      },
    });

    void resolved;
    return row?.used ?? 0;
  }

  private async getResolvedMeteredUsed(
    resolved: ResolvedEntitlements,
    feature: string,
  ): Promise<number> {
    if (resolved.subscription_id) {
      return this.getMeteredUsed(resolved.subscription_id, feature, resolved);
    }
    if (resolved.access_grant_id) {
      return this.getGrantMeteredUsed(resolved.access_grant_id, feature);
    }
    return 0;
  }

  private getGrantUsagePeriod(expires_at?: Date | null) {
    const now = new Date();
    const period_start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const natural_end = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );
    const period_end =
      expires_at && expires_at < natural_end ? expires_at : natural_end;
    return { period_start, period_end };
  }

  private async getGrantMeteredUsed(
    grant_id: string,
    feature: string,
  ): Promise<number> {
    const { period_start } = this.getGrantUsagePeriod();
    const row = await this.grant_usage_repository.findOne({
      where: { grant_id, feature, period_start },
    });
    return row?.used ?? 0;
  }

  private async incrementGrantMeteredUsage(
    grant_id: string,
    feature: string,
    amount: number,
  ): Promise<void> {
    const grant = await this.grant_repository.findOne({
      where: { id: grant_id },
    });
    if (
      !grant ||
      grant.revoked_at !== null ||
      (grant.expires_at !== null && grant.expires_at <= new Date())
    ) {
      return;
    }
    const { period_start, period_end } = this.getGrantUsagePeriod(
      grant.expires_at,
    );
    const existing = await this.grant_usage_repository.findOne({
      where: { grant_id, feature, period_start },
    });
    if (existing) {
      const preloaded = await this.grant_usage_repository.preload({
        id: existing.id,
        used: existing.used + amount,
      });
      if (preloaded) {
        await this.grant_usage_repository.save(preloaded);
      }
      return;
    }
    await this.grant_usage_repository.save({
      grant_id,
      feature,
      period_start,
      period_end,
      used: amount,
    });
  }
}
