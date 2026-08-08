import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Job } from "bullmq";

import { build_dealership_invitation_accept_link, build_dealership_invitation_reject_link } from "../dealership-invitation-link.util";
import { MailService } from "../mail.service";
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
  OUTBOUND_MAIL_JOB_PLAN_LEAD_PROPOSAL,
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
  OutboundMailPlanLeadProposalJobData,
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
} from "./outbound-mail.queue.constants";

@Processor(OUTBOUND_MAIL_QUEUE)
@Injectable()
export class OutboundMailProcessor extends WorkerHost {
  constructor(private readonly mail_service: MailService) {
    super();
  }

  async process(
    job: Job,
  ): Promise<void> {
    if (job.name === OUTBOUND_MAIL_JOB_DEALERSHIP_INVITATION) {
      const data = job.data as OutboundMailDealershipInvitationJobData;
      const invitation_link = build_dealership_invitation_accept_link(
        data.invitation_token,
      );
      const reject_link = build_dealership_invitation_reject_link(
        data.invitation_token,
      );
      await this.mail_service.sendDealershipInvitationEmail({
        to: data.invited_email,
        invitation_link,
        reject_link,
        role: data.invited_role,
        dealership_id: data.dealership_id,
      });
      return;
    }

    if (job.name === OUTBOUND_MAIL_JOB_PASSWORD_RECOVERY) {
      const data = job.data as OutboundMailPasswordRecoveryJobData;
      await this.mail_service.sendPasswordRecoveryEmail(data.to, data.recovery_link);
      return;
    }

    if (job.name === OUTBOUND_MAIL_JOB_DEALERSHIP_TEAM_JOINED) {
      const data = job.data as OutboundMailDealershipTeamJoinedJobData;
      await this.mail_service.sendDealershipTeamJoinedEmail({
        to: data.to,
        role: data.role,
        dealership_id: data.dealership_id,
      });
      return;
    }

    if (job.name === OUTBOUND_MAIL_JOB_LEAD_NOTIFICATION) {
      const data = job.data as OutboundMailLeadNotificationJobData;
      await this.mail_service.sendLeadNotificationEmail({
        to: data.to,
        vehicle_title: data.vehicle_title,
        contacts_url: data.contacts_url,
        vehicle: data.vehicle ?? null,
        lead: data.lead,
      });
      return;
    }

    if (job.name === OUTBOUND_MAIL_JOB_NEW_MESSAGE_NOTIFICATION) {
      const data = job.data as OutboundMailNewMessageNotificationJobData;
      await this.mail_service.sendNewMessageNotificationEmail(data);
      return;
    }

    if (job.name === OUTBOUND_MAIL_JOB_PLAN_LEAD_REQUEST_NOTIFICATION) {
      const data = job.data as OutboundMailPlanLeadRequestNotificationJobData;
      await this.mail_service.sendPlanLeadRequestNotificationEmail({
        to: data.to,
        lead: data.lead,
        created_at: data.created_at,
      });
      return;
    }

    if (job.name === OUTBOUND_MAIL_JOB_PLAN_LEAD_PROPOSAL) {
      const data = job.data as OutboundMailPlanLeadProposalJobData;
      await this.mail_service.sendPlanLeadProposalEmail(data);
      return;
    }

    if (job.name === OUTBOUND_MAIL_JOB_SUBSCRIPTION_WELCOME) {
      const data = job.data as OutboundMailSubscriptionWelcomeJobData;
      await this.mail_service.sendSubscriptionWelcomeEmail(data);
      return;
    }

    if (job.name === OUTBOUND_MAIL_JOB_SUBSCRIPTION_CANCEL_SCHEDULED) {
      const data = job.data as OutboundMailSubscriptionCancelScheduledJobData;
      await this.mail_service.sendSubscriptionCancelScheduledEmail(data);
      return;
    }

    if (job.name === OUTBOUND_MAIL_JOB_SUBSCRIPTION_ENDED) {
      const data = job.data as OutboundMailSubscriptionEndedJobData;
      await this.mail_service.sendSubscriptionEndedEmail(data);
      return;
    }

    if (job.name === OUTBOUND_MAIL_JOB_CHECKOUT_ABANDONED) {
      const data = job.data as OutboundMailCheckoutAbandonedJobData;
      await this.mail_service.sendCheckoutAbandonedEmail(data);
      return;
    }

    if (job.name === OUTBOUND_MAIL_JOB_SUBSCRIPTION_PAYMENT_FAILED) {
      const data = job.data as OutboundMailSubscriptionPaymentFailedJobData;
      await this.mail_service.sendSubscriptionPaymentFailedEmail(data);
      return;
    }

    if (job.name === OUTBOUND_MAIL_JOB_SUBSCRIPTION_PAYMENT_RECEIVED) {
      const data = job.data as OutboundMailSubscriptionPaymentReceivedJobData;
      await this.mail_service.sendSubscriptionPaymentReceivedEmail(data);
      return;
    }

    if (job.name === OUTBOUND_MAIL_JOB_SUBSCRIPTION_PLAN_CHANGED) {
      const data = job.data as OutboundMailSubscriptionPlanChangedJobData;
      await this.mail_service.sendSubscriptionPlanChangedEmail(data);
      return;
    }

    if (job.name === OUTBOUND_MAIL_JOB_LISTING_LIMIT_REACHED) {
      const data = job.data as OutboundMailListingLimitReachedJobData;
      await this.mail_service.sendListingLimitReachedEmail(data);
      return;
    }

    if (job.name === OUTBOUND_MAIL_JOB_FEATURED_PURCHASED) {
      const data = job.data as OutboundMailFeaturedPurchasedJobData;
      await this.mail_service.sendFeaturedPurchasedEmail(data);
      return;
    }

    if (job.name === OUTBOUND_MAIL_JOB_FEATURED_EXPIRED) {
      const data = job.data as OutboundMailFeaturedExpiredJobData;
      await this.mail_service.sendFeaturedExpiredEmail(data);
      return;
    }

    if (job.name === OUTBOUND_MAIL_JOB_USER_WELCOME) {
      const data = job.data as OutboundMailUserWelcomeJobData;
      await this.mail_service.sendUserWelcomeEmail(data);
      return;
    }

    if (job.name === OUTBOUND_MAIL_JOB_NEW_LOGIN) {
      const data = job.data as OutboundMailNewLoginJobData;
      await this.mail_service.sendNewLoginEmail(data);
      return;
    }

    if (job.name === OUTBOUND_MAIL_JOB_PASSWORD_CHANGED) {
      const data = job.data as OutboundMailPasswordChangedJobData;
      await this.mail_service.sendPasswordChangedEmail(data);
      return;
    }

    if (job.name === OUTBOUND_MAIL_JOB_ACCOUNT_DELETED) {
      const data = job.data as OutboundMailAccountDeletedJobData;
      await this.mail_service.sendAccountDeletedEmail(data);
      return;
    }

    if (job.name === OUTBOUND_MAIL_JOB_VEHICLE_PUBLISHED) {
      await this.mail_service.sendSellerVehicleStatusEmail(
        job.data as OutboundMailSellerVehicleJobData,
        "published",
      );
      return;
    }

    if (job.name === OUTBOUND_MAIL_JOB_VEHICLE_APPROVED) {
      await this.mail_service.sendSellerVehicleStatusEmail(
        job.data as OutboundMailSellerVehicleJobData,
        "approved",
      );
      return;
    }

    if (job.name === OUTBOUND_MAIL_JOB_VEHICLE_REJECTED) {
      await this.mail_service.sendSellerVehicleStatusEmail(
        job.data as OutboundMailSellerVehicleJobData,
        "rejected",
      );
      return;
    }

    if (job.name === OUTBOUND_MAIL_JOB_VEHICLE_DEACTIVATED) {
      await this.mail_service.sendSellerVehicleStatusEmail(
        job.data as OutboundMailSellerVehicleJobData,
        "deactivated",
      );
      return;
    }

    if (job.name === OUTBOUND_MAIL_JOB_VEHICLE_SOLD) {
      await this.mail_service.sendSellerVehicleStatusEmail(
        job.data as OutboundMailSellerVehicleJobData,
        "sold",
      );
      return;
    }

    if (job.name === OUTBOUND_MAIL_JOB_VEHICLE_ARCHIVED) {
      await this.mail_service.sendSellerVehicleStatusEmail(
        job.data as OutboundMailSellerVehicleJobData,
        "archived",
      );
      return;
    }

    if (job.name === OUTBOUND_MAIL_JOB_VEHICLE_EXPIRY_WARNING) {
      await this.mail_service.sendSellerVehicleStatusEmail(
        job.data as OutboundMailSellerVehicleJobData,
        "expiry_soon",
      );
      return;
    }

    if (job.name === OUTBOUND_MAIL_JOB_VEHICLE_EXPIRED) {
      await this.mail_service.sendSellerVehicleStatusEmail(
        job.data as OutboundMailSellerVehicleJobData,
        "expired",
      );
      return;
    }

    if (job.name === OUTBOUND_MAIL_JOB_VEHICLE_STATUS_CHANGED) {
      const data = job.data as OutboundMailVehicleStatusChangedJobData;
      await this.mail_service.sendVehicleStatusChangedEmail(data);
      return;
    }

    if (job.name === OUTBOUND_MAIL_JOB_ALERT_MATCH_NOTIFICATION) {
      const data = job.data as OutboundMailAlertMatchNotificationJobData;
      await this.mail_service.sendAlertMatchNotificationEmail(data);
      return;
    }

    if (job.name === OUTBOUND_MAIL_JOB_ALERT_EVENT_NOTIFICATION) {
      const data = job.data as OutboundMailAlertEventNotificationJobData;
      await this.mail_service.sendAlertEventNotificationEmail(data);
      return;
    }

    if (job.name === OUTBOUND_MAIL_JOB_ALERT_DIGEST_NOTIFICATION) {
      const data = job.data as OutboundMailAlertDigestNotificationJobData;
      await this.mail_service.sendAlertDigestNotificationEmail(data);
      return;
    }

    if (job.name === OUTBOUND_MAIL_JOB_APPRAISAL_REQUEST_NOTIFICATION) {
      const data = job.data as OutboundMailAppraisalRequestNotificationJobData;
      await this.mail_service.sendAppraisalRequestNotificationEmail({
        to: data.to,
        appraisal: data.appraisal,
        created_at: data.created_at,
      });
      return;
    }

    if (job.name === OUTBOUND_MAIL_JOB_APPRAISAL_REQUEST_ANSWERED) {
      const data = job.data as OutboundMailAppraisalRequestAnsweredJobData;
      await this.mail_service.sendAppraisalRequestAnsweredEmail({
        to: data.to,
        name: data.name,
        vehicle_label: data.vehicle_label,
        estimated_price_min: data.estimated_price_min,
        estimated_price_max: data.estimated_price_max,
        admin_note: data.admin_note,
      });
      return;
    }

    if (job.name === OUTBOUND_MAIL_JOB_NEWS_ALERT) {
      const data = job.data as OutboundMailNewsAlertJobData;
      await this.mail_service.sendNewsAlertEmail(data);
      return;
    }

    throw new Error(`Trabajo de correo saliente desconocido: ${job.name}`);
  }
}
