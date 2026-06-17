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
  OUTBOUND_MAIL_JOB_PASSWORD_RECOVERY,
  OUTBOUND_MAIL_JOB_VEHICLE_STATUS_CHANGED,
  OUTBOUND_MAIL_QUEUE,
  OutboundMailAlertDigestNotificationJobData,
  OutboundMailAlertEventNotificationJobData,
  OutboundMailAlertMatchNotificationJobData,
  OutboundMailDealershipInvitationJobData,
  OutboundMailDealershipTeamJoinedJobData,
  OutboundMailLeadNotificationJobData,
  OutboundMailPasswordRecoveryJobData,
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
