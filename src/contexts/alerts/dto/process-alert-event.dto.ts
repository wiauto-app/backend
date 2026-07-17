import type { AlertEventType } from "../types/alert-event-type.enum";

export interface ProcessAlertEventDto {
  vehicle_id?: string;
  event_type: AlertEventType;
  profile_id?: string;
  metadata?: Record<string, unknown>;
}
