import { Injectable } from "@nestjs/common";
import { envs } from "@/src/common/envs";
import {
  getContactsUrl,
  getMessagesUrl,
  getVehicleDetailUrl,
} from "@/src/common/frontend-routes";
import { OutboundMailEnqueueService } from "@/src/contexts/shared/mail/outbound-mail-enqueue.service";
import { buildMailVehicleCard } from "@/src/contexts/shared/mail/mail-vehicle-card";
import { toAbsoluteMailAssetUrl } from "@/src/contexts/shared/mail/mail-public-asset-url";

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

    if (input.category === "new_message") {
      await this.sendNewMessageEmail(input);
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

    const vehicle_card = this.buildVehicleCardFromData(data, vehicle_title);

    await this.outbound_mail_enqueue_service.enqueue_lead_notification({
      to: input.to,
      vehicle_title,
      contacts_url: getContactsUrl(),
      vehicle: vehicle_card,
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

  private async sendNewMessageEmail(
    input: NotificationEmailChannelInput,
  ): Promise<void> {
    const data = input.data ?? {};
    const sender_name =
      typeof data.sender_name === "string" && data.sender_name.trim()
        ? data.sender_name
        : "Alguien";
    const message_excerpt =
      typeof data.message_excerpt === "string" && data.message_excerpt.trim()
        ? data.message_excerpt
        : input.body;
    const chat_id =
      typeof data.chat_id === "string" ? data.chat_id : undefined;
    const vehicle_title =
      typeof data.vehicle_title === "string" ? data.vehicle_title : null;

    await this.outbound_mail_enqueue_service.enqueue_new_message_notification({
      to: input.to,
      sender_name,
      message_excerpt,
      messages_url: getMessagesUrl(chat_id),
      vehicle: vehicle_title
        ? this.buildVehicleCardFromData(data, vehicle_title)
        : null,
    });
  }

  private async sendAlertEventEmail(
    input: NotificationEmailChannelInput,
  ): Promise<void> {
    const data = input.data ?? {};
    const vehicle_id = data.vehicle_id;
    const vehicle_detail_url =
      typeof vehicle_id === "string"
        ? getVehicleDetailUrl(vehicle_id)
        : envs.FRONTEND_URL;

    await this.outbound_mail_enqueue_service.enqueue_alert_event_notification({
      to: input.to,
      event_type: input.category,
      title: input.title,
      body_summary: input.body,
      vehicle_detail_url,
      vehicle_image_url: toAbsoluteMailAssetUrl(
        typeof data.vehicle_image_url === "string"
          ? data.vehicle_image_url
          : null,
      ),
      alert_name:
        typeof data.alert_name === "string" ? data.alert_name : null,
    });
  }

  private buildVehicleCardFromData(
    data: Record<string, unknown>,
    vehicle_title: string,
  ) {
    const vehicle_id =
      typeof data.vehicle_id === "string" ? data.vehicle_id : null;
    if (!vehicle_id) {
      return null;
    }

    const publisher_type =
      typeof data.publisher_type === "string"
        ? data.publisher_type
        : "particular";

    return buildMailVehicleCard({
      id: vehicle_id,
      title: vehicle_title,
      price: typeof data.vehicle_price === "number" ? data.vehicle_price : null,
      image_url:
        typeof data.vehicle_image_url === "string"
          ? data.vehicle_image_url
          : null,
      year: typeof data.vehicle_year === "number" ? data.vehicle_year : null,
      mileage:
        typeof data.vehicle_mileage === "number" ? data.vehicle_mileage : null,
      fuel_label:
        typeof data.vehicle_fuel_label === "string"
          ? data.vehicle_fuel_label
          : undefined,
      transmission_label:
        typeof data.vehicle_transmission_label === "string"
          ? data.vehicle_transmission_label
          : undefined,
      location_label:
        typeof data.vehicle_location_label === "string"
          ? data.vehicle_location_label
          : undefined,
      publisher_type,
    });
  }
}
