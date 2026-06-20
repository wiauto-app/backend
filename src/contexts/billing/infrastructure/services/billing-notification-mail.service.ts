import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { OutboundMailEnqueueService } from "@/src/contexts/shared/mail/outbound-mail-enqueue.service";

@Injectable()
export class BillingNotificationMailService {
  constructor(
    private readonly outbound_mail_enqueue_service: OutboundMailEnqueueService,
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
    await this.outbound_mail_enqueue_service.enqueue_subscription_cancel_scheduled(payload);
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
    await this.outbound_mail_enqueue_service.enqueue_subscription_payment_failed(payload);
  }
}
