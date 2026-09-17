import { Logger } from "@nestjs/common";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { envs } from "@/src/common/envs";
import { OutboundMailEnqueueService } from "@/src/contexts/shared/mail/outbound-mail-enqueue.service";

import { GenericLeadEntity } from "../entities/lead.entity";

@Injectable()
export class ContactLeadNotificationService {
  private readonly logger = new Logger(ContactLeadNotificationService.name);

  constructor(
    private readonly outbound_mail_enqueue_service: OutboundMailEnqueueService,
  ) {}

  async notify(lead: GenericLeadEntity): Promise<void> {
    const province_name =
      typeof lead.extra_data.province_name === "string"
        ? lead.extra_data.province_name
        : null;

    const created_at = lead.created_at.toISOString();
    const message =
      typeof lead.extra_data.message === "string" ? lead.extra_data.message : "";

    try {
      await Promise.all(
        envs.ADMIN_ALERTS_EMAILS.map((to) =>
          this.outbound_mail_enqueue_service.enqueue_contact_lead_notification({
            to,
            lead: {
              first_name: lead.first_name,
              last_name: lead.last_name,
              phone: lead.phone,
              email: lead.email,
              province_name,
              message,
            },
            created_at,
          }),
        ),
      );
    } catch (error) {
      this.logger.error(
        `No se pudo encolar la notificación de lead de contacto ${lead.id}`,
        error as Error,
      );
    }
  }
}
