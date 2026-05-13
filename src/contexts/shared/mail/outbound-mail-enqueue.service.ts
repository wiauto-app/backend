import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";

import {
  OUTBOUND_MAIL_JOB_DEALERSHIP_INVITATION,
  OUTBOUND_MAIL_JOB_DEALERSHIP_TEAM_JOINED,
  OUTBOUND_MAIL_JOB_PASSWORD_RECOVERY,
  OUTBOUND_MAIL_QUEUE,
  OutboundMailDealershipInvitationJobData,
  OutboundMailDealershipTeamJoinedJobData,
  OutboundMailPasswordRecoveryJobData,
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
}
