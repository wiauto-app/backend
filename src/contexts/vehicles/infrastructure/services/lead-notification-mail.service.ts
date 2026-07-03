import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { OutboundMailEnqueueService } from "@/src/contexts/shared/mail/outbound-mail-enqueue.service";

import {
  LeadNotificationEmailService,
  SendLeadNotificationEmailPayload,
} from "../../application/ports/lead-notification-email.port";

@Injectable()
export class LeadNotificationMailService implements LeadNotificationEmailService {
  constructor(
    private readonly outbound_mail_enqueue_service: OutboundMailEnqueueService,
  ) {}

  async send_notification_email(
    payload: SendLeadNotificationEmailPayload,
  ): Promise<void> {
    await this.outbound_mail_enqueue_service.enqueue_lead_notification({
      to: payload.to,
      lead: {
        type: payload.lead.type,
        name: payload.lead.name,
        email: payload.lead.email,
        phone: payload.lead.phone,
        phone_code: payload.lead.phone_code,
        message: payload.lead.message,
        callback_scheduled_at: payload.lead.callback_scheduled_at
          ? new Date(payload.lead.callback_scheduled_at).toISOString().slice(0, 10)
          : null,
      },
      vehicle_title: payload.vehicle_title,
    });
  }
}
