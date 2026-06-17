import type { AlertEventType } from "../../domain/enums/alert-event-type.enum";

export abstract class AlertFavoriteProfileLookupPort {
  abstract findProfileIdsByVehicleId(
    vehicle_id: string,
    exclude_profile_id?: string,
  ): Promise<string[]>;
}

export interface AlertGlobalEventRecipient {
  profile_id: string;
  email: string;
}

export abstract class AlertProfileContactLookupPort {
  abstract findEmailByProfileId(profile_id: string): Promise<string | null>;
}

export interface ProcessAlertEventMetadata {
  previous_price?: number;
  new_price?: number;
  message_preview?: string;
  chat_id?: string;
  is_seller_reply?: boolean;
}

export interface AlertEventRecipient {
  profile_id: string;
  alert_id: string | null;
  email: string;
  alert_name?: string;
}

export const alert_event_matches_per_search_toggle = (
  event_type: AlertEventType,
  alert: {
    notify_new_listings: boolean;
    notify_price_drops: boolean;
    notify_sold_removed: boolean;
    notify_featured: boolean;
    notify_recently_updated: boolean;
  },
): boolean => {
  switch (event_type) {
    case "new_listing":
      return alert.notify_new_listings;
    case "price_drop":
      return alert.notify_price_drops;
    case "sold_removed":
      return alert.notify_sold_removed;
    case "featured":
      return alert.notify_featured;
    case "recently_updated":
      return alert.notify_recently_updated;
    default:
      return false;
  }
};

export const alert_event_matches_global_toggle = (
  event_type: AlertEventType,
  prefs: {
    notify_new_matches: boolean;
    notify_price_drops: boolean;
    notify_favorite_changes: boolean;
    notify_new_messages: boolean;
    notify_seller_replies: boolean;
    notify_saved_vehicle_reminders: boolean;
  },
): boolean => {
  switch (event_type) {
    case "new_listing":
    case "featured":
    case "recently_updated":
      return prefs.notify_new_matches;
    case "price_drop":
      return prefs.notify_price_drops;
    case "sold_removed":
      return prefs.notify_favorite_changes;
    case "favorite_change":
      return prefs.notify_favorite_changes;
    case "new_message":
      return prefs.notify_new_messages;
    case "seller_reply":
      return prefs.notify_seller_replies;
    case "saved_vehicle_reminder":
      return prefs.notify_saved_vehicle_reminders;
    default:
      return false;
  }
};
