import { randomBytes } from "node:crypto";

import { Logger } from "@nestjs/common";
import Stripe from "stripe";

import { Injectable as HexInjectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { User } from "@/src/contexts/users/entities/user.entity";
import { ProfileService } from "@/src/contexts/profiles/services/profile.service";
import { DealershipEntity } from "@/src/contexts/dealership/entities/dealership.entity";
import { DealershipMembersEntity } from "@/src/contexts/dealership/entities/dealership-members.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { SUBSCRIPTION_STATUS } from "../types/billing.enums";
import { TypeOrmBillingProfileRepository } from "@/src/contexts/billing/repositories/typeorm.billing-support-repositories";
import { TypeOrmSubscriptionRepository } from "@/src/contexts/billing/repositories/typeorm.subscription-repository";
import { TypeOrmSubscriptionPlanRepository } from "@/src/contexts/billing/repositories/typeorm.subscription-plan-repository";
import { TypeOrmPlanLeadRequestRepository } from "@/src/contexts/billing/repositories/typeorm.plan-lead-request-repository";
import { BillingNotificationMailService } from "../services/billing-notification-mail.service";
import { StripeClient } from "../clients/stripe.client";
import { EntitlementsService } from "./entitlements.service";
import { SubscriptionOverridesService } from "./subscription-overrides.service";
import { PLAN_LEAD_STATUS } from "../types/billing.enums";
import { SubscriptionEntity } from "../entities/subscription.entity";
import { ProfessionalAccountEntity } from "../entities/professional-account.entity";
import { hashPassword } from "@/src/contexts/auth/utils/passwordUtils";

export interface ProvisionCheckoutResult {
  profile_id: string;
  plan_id: string;
  is_new_guest_user: boolean;
};

@HexInjectable()
export class BillingSubscriptionProvisioningService {
  private readonly logger = new Logger(BillingSubscriptionProvisioningService.name);

  constructor(
    private readonly stripe_client: StripeClient,
    private readonly subscription_repository: TypeOrmSubscriptionRepository,
    private readonly billing_profile_repository: TypeOrmBillingProfileRepository,
    private readonly plan_repository: TypeOrmSubscriptionPlanRepository,
    private readonly entitlements_service: EntitlementsService,
    private readonly billing_notification_mail_service: BillingNotificationMailService,
    private readonly profile_service: ProfileService,
    private readonly overrides_service: SubscriptionOverridesService,
    private readonly plan_lead_request_repository: TypeOrmPlanLeadRequestRepository,
    @InjectRepository(User)
    private readonly user_repository: Repository<User>,
    @InjectRepository(DealershipEntity)
    private readonly dealership_repository: Repository<DealershipEntity>,
    @InjectRepository(DealershipMembersEntity)
    private readonly dealership_members_repository: Repository<DealershipMembersEntity>,
    @InjectRepository(SubscriptionEntity)
    private readonly subscription_entity_repository: Repository<SubscriptionEntity>,
    @InjectRepository(ProfessionalAccountEntity)
    private readonly professional_account_repository: Repository<ProfessionalAccountEntity>,
  ) {}

  async provisionFromCheckoutSession(
    session: Stripe.Checkout.Session,
  ): Promise<ProvisionCheckoutResult | null> {
    if (session.mode !== "subscription") {
      return null;
    }

    const full_session = await this.stripe_client.retrieveCheckoutSession(session.id);
    const plan_id = full_session.metadata?.plan_id;
    const plan_version_id = full_session.metadata?.plan_version_id;
    const lead_request_id = full_session.metadata?.lead_request_id;

    if (!plan_id) {
      this.logger.warn(`Checkout ${session.id} sin plan_id en metadata`);
      return null;
    }

    if (!plan_version_id) {
      this.logger.warn(`Checkout ${session.id} sin plan_version_id en metadata`);
      return null;
    }

    const guest_checkout = full_session.metadata?.guest === "true";
    let profile_id = full_session.metadata?.profile_id;
    let is_new_guest_user = false;
    let temporary_password: string | undefined;

    if (!profile_id && guest_checkout) {
      const resolved = await this.resolveGuestProfile(full_session);
      if (!resolved) {
        return null;
      }

      profile_id = resolved.profile_id;
      is_new_guest_user = resolved.is_new_user;
      temporary_password = resolved.temporary_password;
    }

    if (!profile_id) {
      this.logger.warn(`Checkout ${session.id} sin profile_id resoluble`);
      return null;
    }

    const customer_id = this.extractCustomerId(full_session.customer);
    if (!customer_id) {
      this.logger.warn(`Checkout ${session.id} sin customer_id`);
      return null;
    }

    await this.billing_profile_repository.updateStripeCustomerId(profile_id, customer_id);
    await this.stripe_client.updateCustomerMetadata(customer_id, { profile_id });

    const subscription = await this.resolveSubscription(full_session);
    if (!subscription) {
      this.logger.warn(`Checkout ${session.id} sin subscription`);
      return null;
    }

    await this.stripe_client.updateSubscriptionMetadata(subscription.id, {
      profile_id,
      plan_id,
      plan_version_id,
      ...(lead_request_id ? { lead_request_id } : {}),
    });

    const stripe_price_id =
      typeof subscription.items.data[0]?.price === "string"
        ? subscription.items.data[0]?.price
        : subscription.items.data[0]?.price?.id ?? null;

    await this.syncSubscriptionRecord(
      profile_id,
      plan_id,
      customer_id,
      subscription,
      {
        plan_version_id,
        stripe_price_id,
      },
    );
    await this.linkProfessionalAccount(
      profile_id,
      customer_id,
      full_session.metadata?.professional_account_id,
    );
    await this.applyPlanEntitlements(profile_id, plan_id);

    const dealership_id =
      full_session.metadata?.dealership_id ??
      subscription.metadata?.dealership_id ??
      undefined;
    await this.linkDealershipPlan(profile_id, plan_id, dealership_id);

    if (lead_request_id) {
      const local_subscription =
        await this.subscription_entity_repository.findOne({
          where: { stripe_subscription_id: subscription.id },
        });
      if (local_subscription) {
        await this.applyLeadProposalExtras(lead_request_id, local_subscription.id);
      }
    }

    if (subscription.items.data[0]?.current_period_start) {
      const local_subscription =
        await this.subscription_entity_repository.findOne({
          where: { stripe_subscription_id: subscription.id },
        });
      if (
        local_subscription?.current_period_start &&
        local_subscription.current_period_end
      ) {
        await this.entitlements_service.rotateUsagePeriod(
          local_subscription.id,
          local_subscription.current_period_start,
          local_subscription.current_period_end,
        );
      }
    }

    const profile = await this.billing_profile_repository.findById(profile_id);
    const plan = await this.plan_repository.findOne(plan_id);

    if (profile && plan) {
      await this.billing_notification_mail_service.enqueueSubscriptionWelcome({
        to: profile.email,
        plan_name: plan.toPrimitives().name,
        is_new_guest_user,
        temporary_password,
      });
    }

    return { profile_id, plan_id, is_new_guest_user };
  }

  async applyPlanEntitlements(
    _profile_id: string,
    _plan_id: string,
  ): Promise<void> {
    // Capacidades = entitlements de PlanVersion; no mutar roles del perfil.
  }

  async linkDealershipPlan(
    profile_id: string,
    plan_id: string,
    dealership_id_from_metadata?: string,
  ): Promise<void> {
    let dealership_id = dealership_id_from_metadata ?? null;

    if (!dealership_id) {
      const membership = await this.dealership_members_repository.findOne({
        where: { profile_id },
      });
      dealership_id = membership?.dealership_id ?? null;
    }

    if (!dealership_id) {
      return;
    }

    const preloaded = await this.dealership_repository.preload({
      id: dealership_id,
      billing_plan_id: plan_id,
    });

    if (preloaded) {
      await this.dealership_repository.save(preloaded);
    }
  }

  async linkProfessionalAccount(
    profile_id: string,
    stripe_customer_id: string,
    professional_account_id?: string,
  ): Promise<void> {
    let account: ProfessionalAccountEntity | null = null;

    if (professional_account_id) {
      account = await this.professional_account_repository.findOne({
        where: { id: professional_account_id },
      });
    }

    if (!account) {
      account = await this.professional_account_repository.findOne({
        where: { profile_id },
      });
    }

    if (!account) {
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

  async clearDealershipPlan(profile_id: string): Promise<void> {
    const membership = await this.dealership_members_repository.findOne({
      where: { profile_id, role: "owner" },
    });
    if (!membership) {
      return;
    }

    const dealership = await this.dealership_repository.findOne({
      where: { id: membership.dealership_id },
    });
    if (!dealership || dealership.billing_plan_id == null) {
      return;
    }

    const preloaded = await this.dealership_repository.preload({
      id: dealership.id,
      billing_plan_id: null,
    });
    if (preloaded) {
      await this.dealership_repository.save(preloaded);
    }
  }

  async revokePlanEntitlements(profile_id: string): Promise<void> {
    await this.clearDealershipPlan(profile_id);
  }

  async syncSubscriptionRecord(
    profile_id: string,
    plan_id: string,
    customer_id: string,
    subscription: Stripe.Subscription,
    options?: {
      plan_version_id?: string | null;
      stripe_price_id?: string | null;
    },
  ): Promise<void> {
    const first_item = subscription.items.data[0];
    const period_start = first_item?.current_period_start
      ? new Date(first_item.current_period_start * 1000)
      : null;
    const period_end = first_item?.current_period_end
      ? new Date(first_item.current_period_end * 1000)
      : null;

    const plan_version_id =
      options?.plan_version_id ??
      subscription.metadata?.plan_version_id ??
      null;

    const stripe_price_id =
      options?.stripe_price_id ??
      (typeof first_item?.price === "string"
        ? first_item.price
        : first_item?.price?.id ?? null);

    await this.subscription_repository.upsert({
      profile_id,
      plan_id,
      plan_version_id,
      stripe_customer_id: customer_id,
      stripe_subscription_id: subscription.id,
      stripe_price_id,
      status: subscription.status,
      current_period_start: period_start,
      current_period_end: period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
    });

    const local = await this.subscription_entity_repository.findOne({
      where: { stripe_subscription_id: subscription.id },
    });
    if (local && period_start && period_end) {
      await this.entitlements_service.rotateUsagePeriod(
        local.id,
        period_start,
        period_end,
      );
    }
  }

  private async applyLeadProposalExtras(
    lead_request_id: string,
    subscription_id: string,
  ): Promise<void> {
    const lead = await this.plan_lead_request_repository.findById(lead_request_id);
    if (!lead) {
      return;
    }

    if (lead.proposed_overrides?.length) {
      await this.overrides_service.copyProposedOverrides(
        subscription_id,
        lead.proposed_overrides,
      );
    }

    await this.plan_lead_request_repository.preloadAndSave({
      id: lead.id,
      status: PLAN_LEAD_STATUS.ACCEPTED,
    });
  }

  async resolveProfileIdFromSubscription(
    subscription: Stripe.Subscription,
  ): Promise<string | null> {
    const metadata_profile_id = subscription.metadata?.profile_id;
    if (metadata_profile_id) {
      return metadata_profile_id;
    }

    const customer_id =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id;

    if (!customer_id) {
      return null;
    }

    const profile = await this.billing_profile_repository.findByStripeCustomerId(customer_id);
    return profile?.id ?? null;
  }

  private async resolveGuestProfile(session: Stripe.Checkout.Session): Promise<{
    profile_id: string;
    is_new_user: boolean;
    temporary_password?: string;
  } | null> {
    const email =
      session.customer_details?.email ??
      (typeof session.customer === "object" && session.customer && "email" in session.customer
        ? (session.customer.email ?? undefined)
        : undefined);

    if (!email) {
      this.logger.warn(`Checkout guest ${session.id} sin email`);
      return null;
    }

    const name =
      session.customer_details?.name?.trim() ||
      email.split("@")[0] ||
      "Usuario";

    const existing_profile = await this.billing_profile_repository.findByEmail(email);
    if (existing_profile) {
      return { profile_id: existing_profile.id, is_new_user: false };
    }

    const temporary_password = randomBytes(12).toString("base64url");
    const hashed_password = await hashPassword(temporary_password);

    const created_user = this.user_repository.create({
      email,
      password: hashed_password,
      is_email_verified: true,
    });
    const saved_user = await this.user_repository.save(created_user);

    await this.profile_service.createProfile({
      id: saved_user.id,
      name,
    });

    return {
      profile_id: saved_user.id,
      is_new_user: true,
      temporary_password,
    };
  }

  private extractCustomerId(
    customer: Stripe.Checkout.Session["customer"],
  ): string | null {
    if (typeof customer === "string") {
      return customer;
    }

    return customer?.id ?? null;
  }

  private async resolveSubscription(
    session: Stripe.Checkout.Session,
  ): Promise<Stripe.Subscription | null> {
    const extracted = this.extractSubscription(session.subscription);
    if (extracted) {
      return extracted;
    }

    if (typeof session.subscription === "string") {
      return this.stripe_client.retrieveSubscription(session.subscription);
    }

    return null;
  }

  private extractSubscription(
    subscription: Stripe.Checkout.Session["subscription"],
  ): Stripe.Subscription | null {
    if (!subscription) {
      return null;
    }

    if (typeof subscription === "string") {
      return null;
    }

    return subscription;
  }

  isActiveSubscriptionStatus(status: string): boolean {
    return (
      status === SUBSCRIPTION_STATUS.ACTIVE || status === SUBSCRIPTION_STATUS.TRIALING
    );
  }
}
