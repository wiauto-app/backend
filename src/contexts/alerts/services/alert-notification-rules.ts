import type { AlertEventType } from "../types/alert-event-type.enum";
import type { Alert } from "../types/alert";
import type { PrimitiveAlertNotificationPreferences } from "../types/alert-notification-preferences";

export const is_alert_toggle_enabled = (
  event_type: AlertEventType,
  alert: Alert,
): boolean => {
  const primitive = alert.toPrimitives();

  switch (event_type) {
    case "new_listing":
      return primitive.notify_new_listings;
    case "price_drop":
      return primitive.notify_price_drops;
    case "sold_removed":
      return primitive.notify_sold_removed;
    case "featured":
      return primitive.notify_featured;
    case "recently_updated":
      return primitive.notify_recently_updated;
    default:
      return true;
  }
};

export const is_global_toggle_enabled = (
  event_type: AlertEventType,
  preferences: PrimitiveAlertNotificationPreferences,
): boolean => {
  switch (event_type) {
    case "new_listing":
    case "featured":
    case "recently_updated":
      return preferences.notify_new_matches;
    case "price_drop":
      return preferences.notify_price_drops;
    case "favorite_change":
      return preferences.notify_favorite_changes;
    case "new_message":
      return preferences.notify_new_messages;
    case "seller_reply":
      return preferences.notify_seller_replies;
    case "saved_vehicle_reminder":
      return preferences.notify_saved_vehicle_reminders;
    case "sold_removed":
      return preferences.notify_new_matches;
    default:
      return true;
  }
};

export const get_enabled_channels = (
  preferences: PrimitiveAlertNotificationPreferences,
): Array<"email" | "push" | "sms"> => {
  const channels: Array<"email" | "push" | "sms"> = [];
  if (preferences.channel_email) {
    channels.push("email");
  }
  if (preferences.channel_push) {
    channels.push("push");
  }
  if (preferences.channel_sms) {
    channels.push("sms");
  }
  return channels;
};
