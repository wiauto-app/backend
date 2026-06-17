import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";

import type { AlertEventType } from "../enums/alert-event-type.enum";
import type { AlertNotificationChannel } from "../enums/alert-notification-channel.enum";
import type { AlertNotificationEventStatus } from "../enums/alert-notification-event-status.enum";

export interface PrimitiveAlertNotificationEvent {
  id: string;
  profile_id: string;
  alert_id: string | null;
  vehicle_id: string | null;
  event_type: AlertEventType;
  channel: AlertNotificationChannel;
  status: AlertNotificationEventStatus;
  scheduled_for: Date | null;
  sent_at: Date | null;
  payload: Record<string, unknown>;
  created_at: Date;
}

export class AlertNotificationEvent {
  constructor(private readonly primitive_event: PrimitiveAlertNotificationEvent) {}

  static create(payload: {
    profile_id: string;
    alert_id?: string | null;
    vehicle_id?: string | null;
    event_type: AlertEventType;
    channel: AlertNotificationChannel;
    status: AlertNotificationEventStatus;
    scheduled_for?: Date | null;
    payload?: Record<string, unknown>;
  }): AlertNotificationEvent {
    return new AlertNotificationEvent({
      id: uuidv4(),
      profile_id: payload.profile_id,
      alert_id: payload.alert_id ?? null,
      vehicle_id: payload.vehicle_id ?? null,
      event_type: payload.event_type,
      channel: payload.channel,
      status: payload.status,
      scheduled_for: payload.scheduled_for ?? null,
      sent_at: null,
      payload: payload.payload ?? {},
      created_at: new Date(),
    });
  }

  markSent(): AlertNotificationEvent {
    return new AlertNotificationEvent({
      ...this.primitive_event,
      status: "sent",
      sent_at: new Date(),
    });
  }

  markSkipped(): AlertNotificationEvent {
    return new AlertNotificationEvent({
      ...this.primitive_event,
      status: "skipped",
    });
  }

  static fromPrimitives(
    primitive: PrimitiveAlertNotificationEvent,
  ): AlertNotificationEvent {
    return new AlertNotificationEvent(primitive);
  }

  toPrimitives(): PrimitiveAlertNotificationEvent {
    return { ...this.primitive_event };
  }
}
