import type { AlertEventType } from "../types/alert-event-type.enum";
import type { AlertNotificationChannel } from "../types/alert-notification-channel.enum";

export interface ProcessAlertEventDto {
  vehicle_id?: string;
  event_type: AlertEventType;
  profile_id?: string;
  metadata?: Record<string, unknown>;
  /** Channels to skip for this event (e.g. `push` when the recipient has the chat open). */
  exclude_channels?: readonly AlertNotificationChannel[];
}
