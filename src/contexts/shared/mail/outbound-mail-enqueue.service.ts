import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";

import {
  OUTBOUND_MAIL_JOB_ALERT_DIGEST_NOTIFICATION,
  OUTBOUND_MAIL_JOB_ALERT_EVENT_NOTIFICATION,
  OUTBOUND_MAIL_JOB_ALERT_MATCH_NOTIFICATION,
  OUTBOUND_MAIL_JOB_APPRAISAL_REQUEST_ANSWERED,
  OUTBOUND_MAIL_JOB_APPRAISAL_REQUEST_NOTIFICATION,
  OUTBOUND_MAIL_JOB_DEALERSHIP_INVITATION,
  OUTBOUND_MAIL_JOB_DEALERSHIP_TEAM_JOINED,
  OUTBOUND_MAIL_JOB_LEAD_NOTIFICATION,
  OUTBOUND_MAIL_JOB_NEW_MESSAGE_NOTIFICATION,
  OUTBOUND_MAIL_JOB_PLAN_LEAD_REQUEST_NOTIFICATION,
  OUTBOUND_MAIL_JOB_PASSWORD_RECOVERY,
  OUTBOUND_MAIL_JOB_SUBSCRIPTION_WELCOME,
  OUTBOUND_MAIL_JOB_SUBSCRIPTION_CANCEL_SCHEDULED,
  OUTBOUND_MAIL_JOB_SUBSCRIPTION_ENDED,
  OUTBOUND_MAIL_JOB_CHECKOUT_ABANDONED,
  OUTBOUND_MAIL_JOB_SUBSCRIPTION_PAYMENT_FAILED,
  OUTBOUND_MAIL_JOB_SUBSCRIPTION_PAYMENT_RECEIVED,
  OUTBOUND_MAIL_JOB_SUBSCRIPTION_PLAN_CHANGED,
  OUTBOUND_MAIL_JOB_LISTING_LIMIT_REACHED,
  OUTBOUND_MAIL_JOB_FEATURED_PURCHASED,
  OUTBOUND_MAIL_JOB_FEATURED_EXPIRED,
  OUTBOUND_MAIL_JOB_USER_WELCOME,
  OUTBOUND_MAIL_JOB_NEW_LOGIN,
  OUTBOUND_MAIL_JOB_PASSWORD_CHANGED,
  OUTBOUND_MAIL_JOB_ACCOUNT_DELETED,
  OUTBOUND_MAIL_JOB_NEWS_ALERT,
  OUTBOUND_MAIL_JOB_VEHICLE_ARCHIVED,
  OUTBOUND_MAIL_JOB_VEHICLE_APPROVED,
  OUTBOUND_MAIL_JOB_VEHICLE_DEACTIVATED,
  OUTBOUND_MAIL_JOB_VEHICLE_EXPIRED,
  OUTBOUND_MAIL_JOB_VEHICLE_EXPIRY_WARNING,
  OUTBOUND_MAIL_JOB_VEHICLE_PUBLISHED,
  OUTBOUND_MAIL_JOB_VEHICLE_REJECTED,
  OUTBOUND_MAIL_JOB_VEHICLE_SOLD,
  OUTBOUND_MAIL_JOB_VEHICLE_STATUS_CHANGED,
  OUTBOUND_MAIL_QUEUE,
  OutboundMailAlertDigestNotificationJobData,
  OutboundMailAlertEventNotificationJobData,
  OutboundMailAlertMatchNotificationJobData,
  OutboundMailAppraisalRequestAnsweredJobData,
  OutboundMailAppraisalRequestNotificationJobData,
  OutboundMailCheckoutAbandonedJobData,
  OutboundMailDealershipInvitationJobData,
  OutboundMailDealershipTeamJoinedJobData,
  OutboundMailLeadNotificationJobData,
  OutboundMailNewMessageNotificationJobData,
  OutboundMailPlanLeadRequestNotificationJobData,
  OutboundMailPasswordRecoveryJobData,
  OutboundMailSellerVehicleJobData,
  OutboundMailSubscriptionCancelScheduledJobData,
  OutboundMailSubscriptionEndedJobData,
  OutboundMailSubscriptionPaymentFailedJobData,
  OutboundMailSubscriptionPaymentReceivedJobData,
  OutboundMailSubscriptionPlanChangedJobData,
  OutboundMailListingLimitReachedJobData,
  OutboundMailFeaturedPurchasedJobData,
  OutboundMailFeaturedExpiredJobData,
  OutboundMailUserWelcomeJobData,
  OutboundMailNewLoginJobData,
  OutboundMailPasswordChangedJobData,
  OutboundMailAccountDeletedJobData,
  OutboundMailNewsAlertJobData,
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

  async enqueue_subscription_payment_received(
    data: OutboundMailSubscriptionPaymentReceivedJobData,
    job_id?: string,
  ): Promise<void> {
    await this.outbound_mail_queue.add(
      OUTBOUND_MAIL_JOB_SUBSCRIPTION_PAYMENT_RECEIVED,
      data,
      job_id ? { jobId: job_id } : undefined,
    );
  }

  async enqueue_subscription_plan_changed(
    data: OutboundMailSubscriptionPlanChangedJobData,
    job_id?: string,
  ): Promise<void> {
    await this.outbound_mail_queue.add(
      OUTBOUND_MAIL_JOB_SUBSCRIPTION_PLAN_CHANGED,
      data,
      job_id ? { jobId: job_id } : undefined,
    );
  }

  async enqueue_listing_limit_reached(
    data: OutboundMailListingLimitReachedJobData,
    job_id?: string,
  ): Promise<void> {
    await this.outbound_mail_queue.add(
      OUTBOUND_MAIL_JOB_LISTING_LIMIT_REACHED,
      data,
      job_id ? { jobId: job_id } : undefined,
    );
  }

  async enqueue_featured_purchased(
    data: OutboundMailFeaturedPurchasedJobData,
  ): Promise<void> {
    await this.outbound_mail_queue.add(
      OUTBOUND_MAIL_JOB_FEATURED_PURCHASED,
      data,
    );
  }

  async enqueue_featured_expired(
    data: OutboundMailFeaturedExpiredJobData,
  ): Promise<void> {
    await this.outbound_mail_queue.add(OUTBOUND_MAIL_JOB_FEATURED_EXPIRED, data);
  }

  async enqueue_user_welcome(
    data: OutboundMailUserWelcomeJobData,
  ): Promise<void> {
    await this.outbound_mail_queue.add(OUTBOUND_MAIL_JOB_USER_WELCOME, data);
  }

  async enqueue_new_login(data: OutboundMailNewLoginJobData): Promise<void> {
    await this.outbound_mail_queue.add(OUTBOUND_MAIL_JOB_NEW_LOGIN, data);
  }

  async enqueue_password_changed(
    data: OutboundMailPasswordChangedJobData,
  ): Promise<void> {
    await this.outbound_mail_queue.add(OUTBOUND_MAIL_JOB_PASSWORD_CHANGED, data);
  }

  async enqueue_account_deleted(
    data: OutboundMailAccountDeletedJobData,
  ): Promise<void> {
    await this.outbound_mail_queue.add(OUTBOUND_MAIL_JOB_ACCOUNT_DELETED, data);
  }

  /** @deprecated Preferir enqueue_vehicle_* temáticos. */
  async enqueue_vehicle_status_changed(
    data: OutboundMailVehicleStatusChangedJobData,
  ): Promise<void> {
    await this.outbound_mail_queue.add(
      OUTBOUND_MAIL_JOB_VEHICLE_STATUS_CHANGED,
      data,
    );
  }

  async enqueue_vehicle_published(
    data: OutboundMailSellerVehicleJobData,
  ): Promise<void> {
    await this.outbound_mail_queue.add(OUTBOUND_MAIL_JOB_VEHICLE_PUBLISHED, data);
  }

  async enqueue_vehicle_approved(
    data: OutboundMailSellerVehicleJobData,
  ): Promise<void> {
    await this.outbound_mail_queue.add(OUTBOUND_MAIL_JOB_VEHICLE_APPROVED, data);
  }

  async enqueue_vehicle_rejected(
    data: OutboundMailSellerVehicleJobData,
  ): Promise<void> {
    await this.outbound_mail_queue.add(OUTBOUND_MAIL_JOB_VEHICLE_REJECTED, data);
  }

  async enqueue_vehicle_deactivated(
    data: OutboundMailSellerVehicleJobData,
  ): Promise<void> {
    await this.outbound_mail_queue.add(OUTBOUND_MAIL_JOB_VEHICLE_DEACTIVATED, data);
  }

  async enqueue_vehicle_sold(
    data: OutboundMailSellerVehicleJobData,
  ): Promise<void> {
    await this.outbound_mail_queue.add(OUTBOUND_MAIL_JOB_VEHICLE_SOLD, data);
  }

  async enqueue_vehicle_archived(
    data: OutboundMailSellerVehicleJobData,
  ): Promise<void> {
    await this.outbound_mail_queue.add(OUTBOUND_MAIL_JOB_VEHICLE_ARCHIVED, data);
  }

  async enqueue_vehicle_expiry_warning(
    data: OutboundMailSellerVehicleJobData,
  ): Promise<void> {
    await this.outbound_mail_queue.add(
      OUTBOUND_MAIL_JOB_VEHICLE_EXPIRY_WARNING,
      data,
    );
  }

  async enqueue_vehicle_expired(
    data: OutboundMailSellerVehicleJobData,
  ): Promise<void> {
    await this.outbound_mail_queue.add(OUTBOUND_MAIL_JOB_VEHICLE_EXPIRED, data);
  }

  async enqueue_new_message_notification(
    data: OutboundMailNewMessageNotificationJobData,
  ): Promise<void> {
    await this.outbound_mail_queue.add(
      OUTBOUND_MAIL_JOB_NEW_MESSAGE_NOTIFICATION,
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

  async enqueue_appraisal_request_notification(
    data: OutboundMailAppraisalRequestNotificationJobData,
  ): Promise<void> {
    await this.outbound_mail_queue.add(
      OUTBOUND_MAIL_JOB_APPRAISAL_REQUEST_NOTIFICATION,
      data,
    );
  }

  async enqueue_appraisal_request_answered(
    data: OutboundMailAppraisalRequestAnsweredJobData,
  ): Promise<void> {
    await this.outbound_mail_queue.add(
      OUTBOUND_MAIL_JOB_APPRAISAL_REQUEST_ANSWERED,
      data,
    );
  }

  async enqueue_news_alert(
    data: OutboundMailNewsAlertJobData,
  ): Promise<void> {
    await this.outbound_mail_queue.add(OUTBOUND_MAIL_JOB_NEWS_ALERT, data);
  }
}
