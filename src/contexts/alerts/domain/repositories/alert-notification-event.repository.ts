import type { AlertEventType } from "../enums/alert-event-type.enum";
import { AlertNotificationEvent } from "../entities/alert-notification-event";

export abstract class AlertNotificationEventRepository {
  abstract save(event: AlertNotificationEvent): Promise<void>;
  abstract update(event: AlertNotificationEvent): Promise<void>;
  abstract findDuplicate(params: {
    alert_id: string;
    vehicle_id: string;
    event_type: AlertEventType;
  }): Promise<AlertNotificationEvent | null>;
  abstract countNewListingsSince(params: {
    alert_id: string;
    since: Date;
  }): Promise<number>;
  abstract findPendingByProfileId(
    profile_id: string,
  ): Promise<AlertNotificationEvent[]>;
  abstract findPendingForDigest(params: {
    frequency: "daily" | "weekly";
    before: Date;
  }): Promise<AlertNotificationEvent[]>;
  abstract findStaleFavoriteItems(params: {
    reminder_days: number;
    reference_date: Date;
  }): Promise<
    Array<{
      profile_id: string;
      vehicle_id: string;
      added_at: Date;
    }>
  >;
}
