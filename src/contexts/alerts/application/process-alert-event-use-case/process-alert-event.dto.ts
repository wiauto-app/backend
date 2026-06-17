import type { AlertEventType } from "../../domain/enums/alert-event-type.enum";

export class ProcessAlertEventDto {
  vehicle_id?: string;
  event_type: AlertEventType;
  profile_id?: string;
  metadata?: Record<string, unknown>;
}
