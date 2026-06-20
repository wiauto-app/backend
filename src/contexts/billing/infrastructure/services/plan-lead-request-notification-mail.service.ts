import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { OutboundMailEnqueueService } from "@/src/contexts/shared/mail/outbound-mail-enqueue.service";

export type PlanLeadRequestNotificationPayload = {
  recipients: string[];
  lead: {
    name: string;
    email: string;
    phone: string;
    message: string | null;
  };
  created_at: string;
};

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
}
