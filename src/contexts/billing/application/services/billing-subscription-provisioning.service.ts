import { randomBytes } from "node:crypto";

import { Logger } from "@nestjs/common";
import Stripe from "stripe";

import { Injectable as HexInjectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PasswordService } from "@/src/contexts/auth/services/password.service";
import { User } from "@/src/contexts/users/entities/user.entity";
import { ProfileService } from "@/src/contexts/profiles/services/profile.service";
import { PUBLISHER_TYPE } from "@/src/contexts/vehicles/domain/entities/vehicle";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { SUBSCRIPTION_STATUS } from "../../domain/enums/billing.enums";
import {
  BillingProfileRepository,
  SubscriptionPlanRepository,
  SubscriptionRepository,
} from "../../domain/repositories/billing.repositories";
import { BillingNotificationMailService } from "../../infrastructure/services/billing-notification-mail.service";
import { StripeBillingAdapter } from "../../infrastructure/stripe/stripe-billing.adapter";
import { EntitlementsService } from "./entitlements.service";

export type ProvisionCheckoutResult = {
  profile_id: string;
  plan_id: string;
  is_new_guest_user: boolean;
};

@HexInjectable()
export class BillingSubscriptionProvisioningService {
  private readonly logger = new Logger(BillingSubscriptionProvisioningService.name);

  constructor(
    private readonly stripe_adapter: StripeBillingAdapter,
    private readonly subscription_repository: SubscriptionRepository,
    private readonly billing_profile_repository: BillingProfileRepository,
    private readonly plan_repository: SubscriptionPlanRepository,
    private readonly entitlements_service: EntitlementsService,
    private readonly billing_notification_mail_service: BillingNotificationMailService,
    private readonly password_service: PasswordService,
    private readonly profile_service: ProfileService,
    @InjectRepository(User)
    private readonly user_repository: Repository<User>,
  ) {}

  async provisionFromCheckoutSession(
    session: Stripe.Checkout.Session,
  ): Promise<ProvisionCheckoutResult | null> {
    if (session.mode !== "subscription") {
      return null;
    }

    const full_session = await this.stripe_adapter.retrieveCheckoutSession(session.id);
    const plan_id = full_session.metadata?.plan_id;

    if (!plan_id) {
      this.logger.warn(`Checkout ${session.id} sin plan_id en metadata`);
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
    await this.stripe_adapter.updateCustomerMetadata(customer_id, { profile_id });

    const subscription = await this.resolveSubscription(full_session);
    if (!subscription) {
      this.logger.warn(`Checkout ${session.id} sin subscription`);
      return null;
    }

    await this.stripe_adapter.updateSubscriptionMetadata(subscription.id, {
      profile_id,
      plan_id,
    });

    await this.syncSubscriptionRecord(profile_id, plan_id, customer_id, subscription);
    await this.applyPlanEntitlements(profile_id, plan_id);

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

  async applyPlanEntitlements(profile_id: string, plan_id: string): Promise<void> {
    const plan = await this.plan_repository.findOne(plan_id);
    const role_id = plan?.toPrimitives().role_id;

    if (role_id) {
      await this.billing_profile_repository.updateRoleId(profile_id, role_id);
    }

    await this.billing_profile_repository.updatePublisherType(
      profile_id,
      PUBLISHER_TYPE.PROFESSIONAL,
    );
  }

  async revokePlanEntitlements(profile_id: string): Promise<void> {
    const default_role_id = await this.entitlements_service.getDefaultRoleId();
    await this.billing_profile_repository.updateRoleId(profile_id, default_role_id);
    await this.billing_profile_repository.updatePublisherType(
      profile_id,
      PUBLISHER_TYPE.PARTICULAR,
    );
  }

  async syncSubscriptionRecord(
    profile_id: string,
    plan_id: string,
    customer_id: string,
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const first_item = subscription.items.data[0];
    const period_start = first_item?.current_period_start
      ? new Date(first_item.current_period_start * 1000)
      : null;
    const period_end = first_item?.current_period_end
      ? new Date(first_item.current_period_end * 1000)
      : null;

    await this.subscription_repository.upsert({
      profile_id,
      plan_id,
      stripe_customer_id: customer_id,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_start: period_start,
      current_period_end: period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
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
    const hashed_password = await this.password_service.hashPassword(temporary_password);

    const created_user = this.user_repository.create({
      email,
      password: hashed_password,
      is_email_verified: true,
      provider: "local",
    });
    const saved_user = await this.user_repository.save(created_user);

    const default_role_id = await this.entitlements_service.getDefaultRoleId();
    if (!default_role_id) {
      throw new Error("No hay rol por defecto configurado para crear usuarios de billing");
    }

    await this.profile_service.createProfile({
      id: saved_user.id,
      name,
      role_id: default_role_id,
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
      return this.stripe_adapter.retrieveSubscription(session.subscription);
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
