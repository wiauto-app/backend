import { Injectable, Logger } from "@nestjs/common";
import { envs } from "@/src/common/envs";
import { OutboundMailEnqueueService } from "@/src/contexts/shared/mail/outbound-mail-enqueue.service";

import {
  AlertDigestNotificationPayload,
  AlertEventNotificationPayload,
  AlertMatchNotificationPayload,
  AlertNotificationDispatcher,
} from "../../domain/ports/alert-notification.port";

@Injectable()
export class AlertEmailNotificationService extends AlertNotificationDispatcher {
  private readonly logger = new Logger(AlertEmailNotificationService.name);

  constructor(
    private readonly outbound_mail_enqueue_service: OutboundMailEnqueueService,
  ) {
    super();
  }

  async notifyMatch(payload: AlertMatchNotificationPayload): Promise<void> {
    const vehicle_detail_url = `${envs.FRONTEND_URL.replace(/\/$/, "")}/vehiculo/${payload.vehicle_id}`;

    await this.outbound_mail_enqueue_service.enqueue_alert_match_notification({
      to: payload.alert_email,
      alert_name: payload.alert_name,
      vehicle_title: payload.vehicle_title,
      vehicle_price: payload.vehicle_price,
      vehicle_detail_url,
      vehicle_image_url: payload.vehicle_image_url,
      vehicle_year: payload.vehicle_year,
      vehicle_mileage: payload.vehicle_mileage,
      vehicle_fuel_label: payload.vehicle_fuel_label,
      vehicle_transmission_label: payload.vehicle_transmission_label,
      vehicle_location_label: payload.vehicle_location_label,
    });
  }

  async notifyEvent(payload: AlertEventNotificationPayload): Promise<void> {
    if (payload.channel !== "email") {
      return;
    }

    const vehicle_id = payload.payload.vehicle_id;
    const vehicle_detail_url =
      typeof vehicle_id === "string"
        ? `${envs.FRONTEND_URL.replace(/\/$/, "")}/vehiculo/${vehicle_id}`
        : envs.FRONTEND_URL;

    await this.outbound_mail_enqueue_service.enqueue_alert_event_notification({
      to: payload.to,
      event_type: payload.event_type,
      title:
        typeof payload.payload.vehicle_title === "string"
          ? payload.payload.vehicle_title
          : "Notificación de WiAuto",
      body_summary: this.build_event_summary(payload),
      vehicle_detail_url,
      vehicle_image_url:
        typeof payload.payload.vehicle_image_url === "string"
          ? payload.payload.vehicle_image_url
          : null,
      alert_name:
        typeof payload.payload.alert_name === "string"
          ? payload.payload.alert_name
          : null,
    });
  }

  async notifyDigest(payload: AlertDigestNotificationPayload): Promise<void> {
    await this.outbound_mail_enqueue_service.enqueue_alert_digest_notification({
      to: payload.to,
      frequency: payload.frequency,
      events_count: payload.events.length,
      events: payload.events.map((event) => ({
        event_type: event.event_type,
        title:
          typeof event.payload.vehicle_title === "string"
            ? event.payload.vehicle_title
            : "Notificación",
        summary: this.build_event_summary({
          to: payload.to,
          event_type: event.event_type,
          channel: "email",
          payload: event.payload,
        }),
      })),
    });
  }

  private build_event_summary(payload: AlertEventNotificationPayload): string {
    const previous_price = payload.payload.previous_price;
    const new_price = payload.payload.vehicle_price;

    if (
      payload.event_type === "price_drop" &&
      typeof previous_price === "number" &&
      typeof new_price === "number"
    ) {
      return `El precio bajó de ${previous_price} € a ${new_price} €`;
    }

    if (payload.event_type === "sold_removed") {
      return "El anuncio ya no está disponible";
    }

    if (payload.event_type === "new_message") {
      return "Tienes un nuevo mensaje";
    }

    if (payload.event_type === "seller_reply") {
      return "El vendedor respondió a tu mensaje";
    }

    if (payload.event_type === "saved_vehicle_reminder") {
      return "Tienes un vehículo guardado sin revisar";
    }

    if (typeof payload.payload.vehicle_title === "string") {
      return `Novedad sobre ${payload.payload.vehicle_title}`;
    }

    return "Tienes una nueva notificación";
  }
}

@Injectable()
export class AlertPushNotificationStubService {
  private readonly logger = new Logger(AlertPushNotificationStubService.name);

  async notify(payload: AlertEventNotificationPayload): Promise<void> {
    this.logger.log(
      `Push stub: ${payload.event_type} para ${payload.to} (sin envío real)`,
    );
  }
}

@Injectable()
export class AlertSmsNotificationStubService {
  private readonly logger = new Logger(AlertSmsNotificationStubService.name);

  async notify(payload: AlertEventNotificationPayload): Promise<void> {
    this.logger.log(
      `SMS stub: ${payload.event_type} para ${payload.to} (sin envío real)`,
    );
  }
}
