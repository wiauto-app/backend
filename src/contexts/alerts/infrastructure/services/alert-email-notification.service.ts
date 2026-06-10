import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { envs } from "@/src/common/envs";
import { OutboundMailEnqueueService } from "@/src/contexts/shared/mail/outbound-mail-enqueue.service";

import {
  AlertMatchNotificationPayload,
  AlertNotificationDispatcher,
} from "../../domain/ports/alert-notification.port";

@Injectable()
export class AlertEmailNotificationService extends AlertNotificationDispatcher {
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
}
