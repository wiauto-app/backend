import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { OutboundMailEnqueueService } from "@/src/contexts/shared/mail/outbound-mail-enqueue.service";

export interface PlanLeadRequestNotificationPayload {
  recipients: string[];
  lead: {
    name: string;
    email: string;
    phone: string;
    cars_quantity: string;
    message: string | null;
  };
  created_at: string;
}

export interface PlanLeadProposalNotificationPayload {
  to: string;
  lead_name: string;
  plan_name: string;
  checkout_url: string;
  notes: string | null;
}

@Injectable()
export class PlanLeadRequestNotificationMailService {
  constructor(
    private readonly outbound_mail_enqueue_service: OutboundMailEnqueueService,
  ) {}

  async notifyStaff(payload: PlanLeadRequestNotificationPayload): Promise<void> {
    await Promise.all(
      payload.recipients.map((to) =>
        this.outbound_mail_enqueue_service.enqueue_plan_lead_request_notification({
          to,
          lead: payload.lead,
          created_at: payload.created_at,
        }),
      ),
    );
  }

  async notifyProposal(
    payload: PlanLeadProposalNotificationPayload,
  ): Promise<void> {
    await this.outbound_mail_enqueue_service.enqueue_plan_lead_proposal({
      to: payload.to,
      lead_name: payload.lead_name,
      plan_name: payload.plan_name,
      checkout_url: payload.checkout_url,
      notes: payload.notes,
    });
  }
}
