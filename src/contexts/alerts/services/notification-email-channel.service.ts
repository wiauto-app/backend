import { Injectable } from "@nestjs/common";
import { envs } from "@/src/common/envs";
import { OutboundMailEnqueueService } from "@/src/contexts/shared/mail/outbound-mail-enqueue.service";

import type { NotificationEmailChannelInput } from "../types/notify-input";

@Injectable()
export class NotificationEmailChannelService {
  constructor(
    private readonly outbound_mail_enqueue_service: OutboundMailEnqueueService,
  ) {}

  async send(input: NotificationEmailChannelInput): Promise<void> {
    if (input.category === "lead") {
      await this.sendLeadEmail(input);
      return;
    }

    await this.sendAlertEventEmail(input);
  }

  private async sendLeadEmail(
    input: NotificationEmailChannelInput,
  ): Promise<void> {
    const data = input.data ?? {};
    const vehicle_title =
      typeof data.vehicle_title === "string"
        ? data.vehicle_title
        : input.title;

    await this.outbound_mail_enqueue_service.enqueue_lead_notification({
      to: input.to,
      vehicle_title,
      lead: {
        type: typeof data.type === "string" ? data.type : "contact",
        name: typeof data.name === "string" ? data.name : "",
        email: typeof data.email === "string" ? data.email : null,
        phone: typeof data.phone === "string" ? data.phone : null,
        phone_code:
          typeof data.phone_code === "string" ? data.phone_code : null,
        message: typeof data.message === "string" ? data.message : null,
        callback_scheduled_at:
          typeof data.callback_scheduled_at === "string"
            ? data.callback_scheduled_at
            : null,
      },
    });
  }

  private async sendAlertEventEmail(
    input: NotificationEmailChannelInput,
  ): Promise<void> {
    const data = input.data ?? {};
    const vehicle_id = data.vehicle_id;
    const vehicle_detail_url =
      typeof vehicle_id === "string"
        ? `${envs.FRONTEND_URL.replace(/\/$/, "")}/vehiculo/${vehicle_id}`
        : envs.FRONTEND_URL;

    await this.outbound_mail_enqueue_service.enqueue_alert_event_notification({
      to: input.to,
      event_type: input.category,
      title: input.title,
      body_summary: input.body,
      vehicle_detail_url,
      vehicle_image_url:
        typeof data.vehicle_image_url === "string"
          ? data.vehicle_image_url
          : null,
      alert_name:
        typeof data.alert_name === "string" ? data.alert_name : null,
    });
  }
}
