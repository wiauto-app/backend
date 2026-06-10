import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Job } from "bullmq";

import { build_dealership_invitation_accept_link } from "../dealership-invitation-link.util";
import { MailService } from "../mail.service";
import {
  OUTBOUND_MAIL_JOB_ALERT_MATCH_NOTIFICATION,
  OUTBOUND_MAIL_JOB_DEALERSHIP_INVITATION,
  OUTBOUND_MAIL_JOB_DEALERSHIP_TEAM_JOINED,
  OUTBOUND_MAIL_JOB_LEAD_NOTIFICATION,
  OUTBOUND_MAIL_JOB_PASSWORD_RECOVERY,
  OUTBOUND_MAIL_JOB_VEHICLE_STATUS_CHANGED,
  OUTBOUND_MAIL_QUEUE,
  OutboundMailAlertMatchNotificationJobData,
  OutboundMailDealershipInvitationJobData,
  OutboundMailDealershipTeamJoinedJobData,
  OutboundMailLeadNotificationJobData,
  OutboundMailPasswordRecoveryJobData,
  OutboundMailVehicleStatusChangedJobData,
} from "./outbound-mail.queue.constants";

@Processor(OUTBOUND_MAIL_QUEUE)
@Injectable()
export class OutboundMailProcessor extends WorkerHost {
  constructor(private readonly mail_service: MailService) {
    super();
  }

  async process(
    job: Job<
      | OutboundMailDealershipInvitationJobData
      | OutboundMailPasswordRecoveryJobData
      | OutboundMailDealershipTeamJoinedJobData
      | OutboundMailLeadNotificationJobData
      | OutboundMailVehicleStatusChangedJobData
      | OutboundMailAlertMatchNotificationJobData
    >,
  ): Promise<void> {
    if (job.name === OUTBOUND_MAIL_JOB_DEALERSHIP_INVITATION) {
      const data = job.data as OutboundMailDealershipInvitationJobData;
      const invitation_link = build_dealership_invitation_accept_link(
        data.invitation_token,
      );
      await this.mail_service.sendDealershipInvitationEmail({
        to: data.invited_email,
        invitation_link,
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
        lead: data.lead,
      });
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

    throw new Error(`Trabajo de correo saliente desconocido: ${job.name}`);
  }
}
