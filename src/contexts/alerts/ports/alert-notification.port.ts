import type { AlertEventType } from "../types/alert-event-type.enum";
import type { AlertNotificationChannel } from "../types/alert-notification-channel.enum";

export interface AlertMatchNotificationPayload {
  alert_id: string;
  alert_name: string;
  alert_email: string;
  vehicle_id: string;
  vehicle_title: string;
  vehicle_price: number;
  vehicle_image_url: string | null;
  vehicle_year: number;
  vehicle_mileage: number;
  vehicle_fuel_label: string;
  vehicle_transmission_label: string;
  vehicle_location_label: string;
}

export interface AlertEventNotificationPayload {
  to: string;
  event_type: AlertEventType;
  channel: AlertNotificationChannel;
  payload: Record<string, unknown>;
}

export interface AlertDigestNotificationPayload {
  to: string;
  frequency: "daily" | "weekly";
  events: Array<{
    event_type: AlertEventType;
    payload: Record<string, unknown>;
  }>;
}

export abstract class AlertNotificationDispatcher {
  abstract notifyMatch(
    payload: AlertMatchNotificationPayload,
  ): Promise<void>;

  abstract notifyEvent(payload: AlertEventNotificationPayload): Promise<void>;

  abstract notifyDigest(payload: AlertDigestNotificationPayload): Promise<void>;
}

export abstract class AlertPushNotificationPort {
  abstract notify(payload: AlertEventNotificationPayload): Promise<void>;
}

export abstract class AlertSmsNotificationPort {
  abstract notify(payload: AlertEventNotificationPayload): Promise<void>;
}
