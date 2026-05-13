import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { OutboundMailEnqueueService } from "@/src/contexts/shared/mail/outbound-mail-enqueue.service";
import {
  DealershipInvitationEmailService,
  SendDealershipInvitationEmailPayload,
} from "../../domain/services/dealership-invitation-email.service";

@Injectable()
export class DealershipInvitationMailService implements DealershipInvitationEmailService {
  constructor(
    private readonly outbound_mail_enqueue_service: OutboundMailEnqueueService,
  ) {}

  async send_invitation_email(
    payload: SendDealershipInvitationEmailPayload,
  ): Promise<void> {
    await this.outbound_mail_enqueue_service.enqueue_dealership_invitation({
      invited_email: payload.invited_email,
      invited_role: payload.invited_role,
      dealership_id: payload.dealership_id,
      invitation_token: payload.invitation_token,
    });
  }
}
