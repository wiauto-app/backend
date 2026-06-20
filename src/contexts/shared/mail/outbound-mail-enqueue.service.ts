import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";

import {
  OUTBOUND_MAIL_JOB_ALERT_DIGEST_NOTIFICATION,
  OUTBOUND_MAIL_JOB_ALERT_EVENT_NOTIFICATION,
  OUTBOUND_MAIL_JOB_ALERT_MATCH_NOTIFICATION,
  OUTBOUND_MAIL_JOB_DEALERSHIP_INVITATION,
  OUTBOUND_MAIL_JOB_DEALERSHIP_TEAM_JOINED,
  OUTBOUND_MAIL_JOB_LEAD_NOTIFICATION,
  OUTBOUND_MAIL_JOB_PLAN_LEAD_REQUEST_NOTIFICATION,
  OUTBOUND_MAIL_JOB_PASSWORD_RECOVERY,
  OUTBOUND_MAIL_JOB_SUBSCRIPTION_WELCOME,
  OUTBOUND_MAIL_JOB_SUBSCRIPTION_CANCEL_SCHEDULED,
  OUTBOUND_MAIL_JOB_SUBSCRIPTION_ENDED,
  OUTBOUND_MAIL_JOB_CHECKOUT_ABANDONED,
  OUTBOUND_MAIL_JOB_SUBSCRIPTION_PAYMENT_FAILED,
  OUTBOUND_MAIL_JOB_VEHICLE_STATUS_CHANGED,
  OUTBOUND_MAIL_QUEUE,
  OutboundMailAlertDigestNotificationJobData,
  OutboundMailAlertEventNotificationJobData,
  OutboundMailAlertMatchNotificationJobData,
  OutboundMailCheckoutAbandonedJobData,
  OutboundMailDealershipInvitationJobData,
  OutboundMailDealershipTeamJoinedJobData,
  OutboundMailLeadNotificationJobData,
  OutboundMailPlanLeadRequestNotificationJobData,
  OutboundMailPasswordRecoveryJobData,
  OutboundMailSubscriptionCancelScheduledJobData,
  OutboundMailSubscriptionEndedJobData,
  OutboundMailSubscriptionPaymentFailedJobData,
  OutboundMailSubscriptionWelcomeJobData,
  OutboundMailVehicleStatusChangedJobData,
} from "./queues/outbound-mail.queue.constants";

@Injectable()
export class OutboundMailEnqueueService {
  constructor(
    @InjectQueue(OUTBOUND_MAIL_QUEUE)
    private readonly outbound_mail_queue: Queue,
  ) {}

  async enqueue_dealership_invitation(
    data: OutboundMailDealershipInvitationJobData,
  ): Promise<void> {
    await this.outbound_mail_queue.add(
      OUTBOUND_MAIL_JOB_DEALERSHIP_INVITATION,
      data,
    );
  }

  async enqueue_password_recovery(
    data: OutboundMailPasswordRecoveryJobData,
  ): Promise<void> {
    await this.outbound_mail_queue.add(OUTBOUND_MAIL_JOB_PASSWORD_RECOVERY, data);
  }

  async enqueue_dealership_team_joined(
    data: OutboundMailDealershipTeamJoinedJobData,
  ): Promise<void> {
    await this.outbound_mail_queue.add(OUTBOUND_MAIL_JOB_DEALERSHIP_TEAM_JOINED, data);
  }

  async enqueue_lead_notification(
    data: OutboundMailLeadNotificationJobData,
  ): Promise<void> {
    await this.outbound_mail_queue.add(OUTBOUND_MAIL_JOB_LEAD_NOTIFICATION as string, data);
  }

  async enqueue_plan_lead_request_notification(
    data: OutboundMailPlanLeadRequestNotificationJobData,
  ): Promise<void> {
    await this.outbound_mail_queue.add(
      OUTBOUND_MAIL_JOB_PLAN_LEAD_REQUEST_NOTIFICATION,
      data,
    );
  }

  async enqueue_subscription_welcome(
    data: OutboundMailSubscriptionWelcomeJobData,
  ): Promise<void> {
    await this.outbound_mail_queue.add(OUTBOUND_MAIL_JOB_SUBSCRIPTION_WELCOME, data);
  }

  async enqueue_subscription_cancel_scheduled(
    data: OutboundMailSubscriptionCancelScheduledJobData,
  ): Promise<void> {
    await this.outbound_mail_queue.add(
      OUTBOUND_MAIL_JOB_SUBSCRIPTION_CANCEL_SCHEDULED,
      data,
    );
  }

  async enqueue_subscription_ended(
    data: OutboundMailSubscriptionEndedJobData,
  ): Promise<void> {
    await this.outbound_mail_queue.add(OUTBOUND_MAIL_JOB_SUBSCRIPTION_ENDED, data);
  }

  async enqueue_checkout_abandoned(
    data: OutboundMailCheckoutAbandonedJobData,
  ): Promise<void> {
    await this.outbound_mail_queue.add(OUTBOUND_MAIL_JOB_CHECKOUT_ABANDONED, data);
  }

  async enqueue_subscription_payment_failed(
    data: OutboundMailSubscriptionPaymentFailedJobData,
  ): Promise<void> {
    await this.outbound_mail_queue.add(
      OUTBOUND_MAIL_JOB_SUBSCRIPTION_PAYMENT_FAILED,
      data,
    );
  }

  async enqueue_vehicle_status_changed(
    data: OutboundMailVehicleStatusChangedJobData,
  ): Promise<void> {
    await this.outbound_mail_queue.add(
      OUTBOUND_MAIL_JOB_VEHICLE_STATUS_CHANGED,
      data,
    );
  }

  async enqueue_alert_match_notification(
    data: OutboundMailAlertMatchNotificationJobData,
  ): Promise<void> {
    await this.outbound_mail_queue.add(
      OUTBOUND_MAIL_JOB_ALERT_MATCH_NOTIFICATION,
      data,
    );
  }

  async enqueue_alert_event_notification(
    data: OutboundMailAlertEventNotificationJobData,
  ): Promise<void> {
    await this.outbound_mail_queue.add(
      OUTBOUND_MAIL_JOB_ALERT_EVENT_NOTIFICATION,
      data,
    );
  }

  async enqueue_alert_digest_notification(
    data: OutboundMailAlertDigestNotificationJobData,
  ): Promise<void> {
    await this.outbound_mail_queue.add(
      OUTBOUND_MAIL_JOB_ALERT_DIGEST_NOTIFICATION,
      data,
    );
  }
}
