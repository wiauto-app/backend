import { Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import Stripe from "stripe";
import { Repository } from "typeorm";

import { envs } from "@/src/common/envs";
import { AssistantQuotaService } from "@/src/contexts/assistant/services/assistant-quota.service";
import type { PlanEffectConfig } from "@/src/contexts/billing/types/subscription-plan";
import { Injectable as HexInjectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { VehicleEntity } from "@/src/contexts/vehicles/entities/vehicle.entity";
import { FEATURED_DURATION_MS } from "@/src/contexts/vehicles/utils/owner-vehicle-rules";
import { VehicleSearchIndexer } from "@/src/contexts/vehicles/search/indexing/vehicle-search-indexer.service";
import {
  BILLING_INVOICE_STATUS,
  ONE_TIME_PURCHASE_STATUS,
  SUBSCRIPTION_STATUS,
} from "../types/billing.enums";
import { TypeOrmBillingProfileRepository } from "@/src/contexts/billing/repositories/typeorm.billing-support-repositories";
import { TypeOrmStripeWebhookEventRepository } from "@/src/contexts/billing/repositories/typeorm.billing-support-repositories";
import { TypeOrmOneTimePurchaseRepository } from "@/src/contexts/billing/repositories/typeorm.billing-support-repositories";
import { TypeOrmBillingInvoiceRepository } from "@/src/contexts/billing/repositories/typeorm.billing-support-repositories";
import { TypeOrmSubscriptionRepository } from "@/src/contexts/billing/repositories/typeorm.subscription-repository";
import { TypeOrmSubscriptionPlanRepository } from "@/src/contexts/billing/repositories/typeorm.subscription-plan-repository";
import { BillingNotificationMailService } from "../services/billing-notification-mail.service";
import { StripeClient } from "../clients/stripe.client";
import { BillingSubscriptionProvisioningService } from "./billing-subscription-provisioning.service";

@HexInjectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);

  constructor(
    private readonly stripe_client: StripeClient,
    private readonly webhook_event_repository: TypeOrmStripeWebhookEventRepository,
    private readonly subscription_repository: TypeOrmSubscriptionRepository,
    private readonly billing_profile_repository: TypeOrmBillingProfileRepository,
    private readonly plan_repository: TypeOrmSubscriptionPlanRepository,
    private readonly invoice_repository: TypeOrmBillingInvoiceRepository,
    private readonly purchase_repository: TypeOrmOneTimePurchaseRepository,
    private readonly provisioning_service: BillingSubscriptionProvisioningService,
    private readonly billing_notification_mail_service: BillingNotificationMailService,
    @InjectRepository(VehicleEntity)
    private readonly vehicle_repository: Repository<VehicleEntity>,
    private readonly vehicle_search_indexer: VehicleSearchIndexer,
    private readonly assistant_quota_service: AssistantQuotaService,
  ) {}

  async handle(payload: Buffer, signature: string | undefined): Promise<{ received: boolean }> {
    if (!signature) {
      throw new Error("Falta cabecera stripe-signature");
    }

    const event = this.stripe_client.constructWebhookEvent(payload, signature);

    if (await this.webhook_event_repository.exists(event.id)) {
      return { received: true };
    }

    await this.webhook_event_repository.save(event.id, event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        await this.handleCheckoutCompleted(event.data.object);
        break;
      }
      case "checkout.session.expired": {
        await this.handleCheckoutExpired(event.data.object);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        await this.handleSubscriptionUpdated(event.data.object);
        break;
      }
      case "customer.subscription.deleted": {
        await this.handleSubscriptionDeleted(event.data.object);
        break;
      }
      case "invoice.paid": {
        await this.handleInvoicePaid(event.data.object);
        break;
      }
      case "invoice.payment_failed": {
        await this.handleInvoicePaymentFailed(event.data.object);
        break;
      }
      case "payment_intent.succeeded": {
        await this.handlePaymentIntentSucceeded(event.data.object);
        break;
      }
      default: {
        this.logger.debug(`Evento Stripe ignorado: ${event.type}`);
        break;
      }
    }

    return { received: true };
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    if (session.mode === "subscription") {
      await this.provisioning_service.provisionFromCheckoutSession(session);
      return;
    }

    const profile_id = session.metadata?.profile_id;
    const plan_id = session.metadata?.plan_id;

    if (!profile_id || !plan_id) {
      return;
    }

    if (session.mode === "payment") {
      const payment_intent_id =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null;

      await this.handleOneTimePurchase({
        profile_id,
        plan_id,
        payment_intent_id,
        metadata: session.metadata ?? {},
      });
    }
  }

  private async handleCheckoutExpired(session: Stripe.Checkout.Session) {
    if (session.mode !== "subscription") {
      return;
    }

    const email =
      session.customer_email ??
      session.customer_details?.email ??
      null;

    if (!email) {
      return;
    }

    const plan_id = session.metadata?.plan_id;
    let plan_name: string | null = null;

    if (plan_id) {
      const plan = await this.plan_repository.findOne(plan_id);
      plan_name = plan?.toPrimitives().name ?? null;
    }

    await this.billing_notification_mail_service.enqueueCheckoutAbandoned({
      to: email,
      plan_name,
      plans_url: `${envs.FRONTEND_URL}/planes`,
    });
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const plan_id = subscription.metadata.plan_id;
    const profile_id = await this.provisioning_service.resolveProfileIdFromSubscription(
      subscription,
    );

    if (!profile_id || !plan_id) {
      return;
    }

    const customer_id =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;

    if (!customer_id) {
      return;
    }

    const previous = await this.subscription_repository.findByStripeSubscriptionId(
      subscription.id,
    );

    await this.provisioning_service.syncSubscriptionRecord(
      profile_id,
      plan_id,
      customer_id,
      subscription,
    );

    if (this.provisioning_service.isActiveSubscriptionStatus(subscription.status)) {
      await this.provisioning_service.applyPlanEntitlements(profile_id, plan_id);
    }

    const cancel_scheduled_now =
      subscription.cancel_at_period_end &&
      !previous?.cancel_at_period_end &&
      subscription.metadata.cancel_scheduled_email_sent !== "true";

    if (cancel_scheduled_now) {
      await this.sendCancelScheduledEmail(profile_id, plan_id, subscription);
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const profile_id = await this.provisioning_service.resolveProfileIdFromSubscription(
      subscription,
    );

    if (!profile_id) {
      return;
    }

    await this.provisioning_service.revokePlanEntitlements(profile_id);

    const plan_id = subscription.metadata.plan_id;
    let plan_name = "tu plan";

    if (plan_id) {
      const plan = await this.plan_repository.findOne(plan_id);
      plan_name = plan?.toPrimitives().name ?? plan_name;
    }

    const profile = await this.billing_profile_repository.findById(profile_id);
    if (profile) {
      await this.billing_notification_mail_service.enqueueSubscriptionEnded({
        to: profile.email,
        plan_name,
      });
    }
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    const customer_id =
      typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

    if (!customer_id) {
      return;
    }

    const profile = await this.findProfileByStripeCustomerId(customer_id);
    if (!profile) {
      return;
    }

    await this.invoice_repository.upsert({
      profile_id: profile.id,
      stripe_invoice_id: invoice.id,
      amount_paid_cents: invoice.amount_paid,
      currency: invoice.currency,
      status: BILLING_INVOICE_STATUS.PAID,
      invoice_pdf_url: invoice.invoice_pdf ?? null,
      hosted_invoice_url: invoice.hosted_invoice_url ?? null,
      paid_at: invoice.status_transitions.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000)
        : new Date(),
    });
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const customer_id =
      typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

    if (!customer_id) {
      return;
    }

    const profile_record = await this.billing_profile_repository.findByStripeCustomerId(
      customer_id,
    );

    if (!profile_record) {
      return;
    }

    const profile = await this.billing_profile_repository.findById(profile_record.id);
    if (!profile) {
      return;
    }

    await this.invoice_repository.upsert({
      profile_id: profile.id,
      stripe_invoice_id: invoice.id,
      amount_paid_cents: invoice.amount_paid,
      currency: invoice.currency,
      status: BILLING_INVOICE_STATUS.OPEN,
      invoice_pdf_url: invoice.invoice_pdf ?? null,
      hosted_invoice_url: invoice.hosted_invoice_url ?? null,
      paid_at: null,
    });

    let plan_name: string | null = null;
    const subscription = await this.subscription_repository.findActiveByProfileId(profile.id);

    if (subscription) {
      plan_name = subscription.plan_name;
    }

    let portal_url: string | null = null;
    if (profile.stripe_customer_id) {
      try {
        portal_url = await this.stripe_client.createPortalSession(profile.stripe_customer_id);
      } catch (error) {
        this.logger.warn(
          `No se pudo generar portal para aviso de pago fallido (${profile.id})`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    await this.billing_notification_mail_service.enqueueSubscriptionPaymentFailed({
      to: profile.email,
      plan_name,
      portal_url,
    });
  }

  private async handlePaymentIntentSucceeded(payment_intent: Stripe.PaymentIntent) {
    const profile_id = payment_intent.metadata.profile_id;
    const plan_id = payment_intent.metadata.plan_id;

    if (!profile_id || !plan_id) {
      return;
    }

    await this.handleOneTimePurchase({
      profile_id,
      plan_id,
      payment_intent_id: payment_intent.id,
      metadata: payment_intent.metadata,
    });
  }

  private async handleOneTimePurchase(params: {
    profile_id: string;
    plan_id: string;
    payment_intent_id: string | null;
    metadata: Record<string, unknown>;
  }) {
    const { profile_id, plan_id, payment_intent_id, metadata } = params;

    if (payment_intent_id) {
      const existing = await this.purchase_repository.findByStripePaymentIntentId(
        payment_intent_id,
      );

      if (existing?.metadata?.effect_applied === true) {
        return;
      }
    }

    await this.purchase_repository.create({
      profile_id,
      plan_id,
      stripe_payment_intent_id: payment_intent_id,
      status: ONE_TIME_PURCHASE_STATUS.COMPLETED,
      metadata,
    });

    await this.applyOneTimeEffect(profile_id, plan_id, metadata);

    if (payment_intent_id) {
      await this.purchase_repository.markEffectApplied(payment_intent_id);
    }
  }

  private async sendCancelScheduledEmail(
    profile_id: string,
    plan_id: string,
    subscription: Stripe.Subscription,
  ) {
    const profile = await this.billing_profile_repository.findById(profile_id);
    const plan = await this.plan_repository.findOne(plan_id);

    if (!profile || !plan) {
      return;
    }

    const first_item = subscription.items.data[0];
    const period_end = first_item?.current_period_end
      ? new Date(first_item.current_period_end * 1000).toLocaleDateString("es-ES", {
          dateStyle: "long",
        })
      : "el final del periodo actual";

    let portal_url = `${envs.FRONTEND_URL}/monetizacion`;

    if (profile.stripe_customer_id) {
      try {
        portal_url = await this.stripe_client.createPortalSession(profile.stripe_customer_id);
      } catch (error) {
        this.logger.warn(
          `No se pudo generar portal para cancelación programada (${profile_id})`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    await this.billing_notification_mail_service.enqueueSubscriptionCancelScheduled({
      to: profile.email,
      plan_name: plan.toPrimitives().name,
      period_end,
      portal_url,
    });

    await this.stripe_client.updateSubscriptionMetadata(subscription.id, {
      cancel_scheduled_email_sent: "true",
    });
  }

  private async applyOneTimeEffect(
    profile_id: string,
    plan_id: string,
    metadata: Record<string, unknown>,
  ) {
    const plan = await this.plan_repository.findOne(plan_id);
    if (!plan) {
      return;
    }

    const primitives = plan.toPrimitives();
    const effect_config = (primitives.effect_config ?? {}) as PlanEffectConfig;
    const effect_type = effect_config.type;

    if (effect_type === "assistant_credits") {
      const credits = effect_config.credits;
      if (!credits || credits <= 0) {
        this.logger.warn(
          `Plan ${plan_id} con assistant_credits sin créditos válidos`,
        );
        return;
      }

      await this.assistant_quota_service.addPurchasedCredits(profile_id, credits);
      return;
    }

    const is_feature_vehicle =
      effect_type === "feature_vehicle" || primitives.slug === "destacar-vehiculo";

    if (!is_feature_vehicle) {
      return;
    }

    const vehicle_id = metadata.vehicle_id;
    if (typeof vehicle_id !== "string" || !vehicle_id) {
      return;
    }

    const existing = await this.vehicle_repository.findOne({
      where: { id: vehicle_id },
      relations: { profile: true },
    });

    if (!existing || existing.profile.id !== profile_id) {
      return;
    }

    const now = new Date();
    const featured_expires_at = new Date(now.getTime() + FEATURED_DURATION_MS);

    const preloaded = await this.vehicle_repository.preload({
      id: vehicle_id,
      is_featured: true,
      featured_expires_at,
    });

    if (!preloaded) {
      return;
    }

    await this.vehicle_repository.save(preloaded);
    await this.vehicle_search_indexer.syncVehicle(vehicle_id, preloaded.status);
  }

  private async findProfileByStripeCustomerId(customer_id: string) {
    return this.billing_profile_repository.findByStripeCustomerId(customer_id);
  }
}
