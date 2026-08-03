import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { getFrontendUrl, getVehicleEditUrl } from "@/src/common/frontend-routes";
import { OutboundMailEnqueueService } from "@/src/contexts/shared/mail/outbound-mail-enqueue.service";
import { TypeOrmBillingProfileRepository } from "@/src/contexts/billing/repositories/typeorm.billing-support-repositories";
import { StripeClient } from "../clients/stripe.client";

@Injectable()
export class BillingNotificationMailService {
  constructor(
    private readonly outbound_mail_enqueue_service: OutboundMailEnqueueService,
    private readonly billing_profile_repository: TypeOrmBillingProfileRepository,
    private readonly stripe_client: StripeClient,
  ) {}

  async enqueueSubscriptionWelcome(payload: {
    to: string;
    plan_name: string;
    is_new_guest_user: boolean;
    temporary_password?: string;
  }): Promise<void> {
    await this.outbound_mail_enqueue_service.enqueue_subscription_welcome(payload);
  }

  async enqueueSubscriptionCancelScheduled(payload: {
    to: string;
    plan_name: string;
    period_end: string;
    portal_url: string;
  }): Promise<void> {
    await this.outbound_mail_enqueue_service.enqueue_subscription_cancel_scheduled(
      payload,
    );
  }

  async enqueueSubscriptionEnded(payload: {
    to: string;
    plan_name: string;
  }): Promise<void> {
    await this.outbound_mail_enqueue_service.enqueue_subscription_ended(payload);
  }

  async enqueueCheckoutAbandoned(payload: {
    to: string;
    plan_name: string | null;
    plans_url: string;
  }): Promise<void> {
    await this.outbound_mail_enqueue_service.enqueue_checkout_abandoned(payload);
  }

  async enqueueSubscriptionPaymentFailed(payload: {
    to: string;
    plan_name: string | null;
    portal_url: string | null;
  }): Promise<void> {
    await this.outbound_mail_enqueue_service.enqueue_subscription_payment_failed(
      payload,
    );
  }

  async enqueueSubscriptionPaymentReceived(payload: {
    to: string;
    plan_name: string;
    amount_paid_cents: number;
    currency: string;
    is_renewal: boolean;
    invoice_url: string | null;
    stripe_customer_id: string | null;
    stripe_invoice_id: string;
  }): Promise<void> {
    const amount_label = new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: (payload.currency || "eur").toUpperCase(),
    }).format(payload.amount_paid_cents / 100);

    let portal_url: string | null = null;
    if (payload.stripe_customer_id) {
      try {
        portal_url = await this.stripe_client.createPortalSession(
          payload.stripe_customer_id,
        );
      } catch {
        portal_url = getFrontendUrl("PLANS");
      }
    }

    await this.outbound_mail_enqueue_service.enqueue_subscription_payment_received(
      {
        to: payload.to,
        plan_name: payload.plan_name,
        amount_label,
        currency: payload.currency,
        is_renewal: payload.is_renewal,
        invoice_url: payload.invoice_url,
        portal_url,
      },
      `subscription-payment-${payload.stripe_invoice_id}`,
    );
  }

  async enqueueSubscriptionPlanChanged(payload: {
    to: string;
    previous_plan_name: string;
    new_plan_name: string;
    stripe_customer_id: string | null;
    stripe_subscription_id: string;
    new_plan_id: string;
  }): Promise<void> {
    let portal_url: string | null = null;
    if (payload.stripe_customer_id) {
      try {
        portal_url = await this.stripe_client.createPortalSession(
          payload.stripe_customer_id,
        );
      } catch {
        portal_url = getFrontendUrl("PLANS");
      }
    }

    await this.outbound_mail_enqueue_service.enqueue_subscription_plan_changed(
      {
        to: payload.to,
        previous_plan_name: payload.previous_plan_name,
        new_plan_name: payload.new_plan_name,
        portal_url,
      },
      `plan-changed-${payload.stripe_subscription_id}-${payload.new_plan_id}`,
    );
  }

  async enqueueListingLimitReached(payload: {
    profile_id: string;
    max_listings: number;
    listings_used: number;
    plan_name: string | null;
  }): Promise<void> {
    const profile = await this.billing_profile_repository.findById(
      payload.profile_id,
    );
    if (!profile?.email) {
      return;
    }

    const day_key = new Date().toISOString().slice(0, 10);
    await this.outbound_mail_enqueue_service.enqueue_listing_limit_reached(
      {
        to: profile.email,
        max_listings: payload.max_listings,
        listings_used: payload.listings_used,
        plan_name: payload.plan_name,
        plans_url: getFrontendUrl("PLANS"),
      },
      `listing-limit-${payload.profile_id}-${day_key}`,
    );
  }

  async enqueueFeaturedPurchased(payload: {
    to: string;
    vehicle_title: string;
    featured_expires_at: Date;
    vehicle_id: string;
    publisher_type?: string;
  }): Promise<void> {
    await this.outbound_mail_enqueue_service.enqueue_featured_purchased({
      to: payload.to,
      vehicle_title: payload.vehicle_title,
      featured_expires_at_label: payload.featured_expires_at.toLocaleDateString(
        "es-ES",
        { dateStyle: "long" },
      ),
      vehicle_edit_url: getVehicleEditUrl(
        payload.vehicle_id,
        payload.publisher_type ?? "particular",
      ),
    });
  }

  async enqueueFeaturedExpired(payload: {
    profile_id: string;
    vehicle_id: string;
    vehicle_title: string;
  }): Promise<void> {
    const profile = await this.billing_profile_repository.findById(
      payload.profile_id,
    );
    if (!profile?.email) {
      return;
    }

    await this.outbound_mail_enqueue_service.enqueue_featured_expired({
      to: profile.email,
      vehicle_title: payload.vehicle_title,
      vehicle_edit_url: getVehicleEditUrl(payload.vehicle_id, "particular"),
    });
  }
}
