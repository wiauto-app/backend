export const ALERT_EVENT_TYPE = {
  NEW_LISTING: "new_listing",
  PRICE_DROP: "price_drop",
  SOLD_REMOVED: "sold_removed",
  FEATURED: "featured",
  RECENTLY_UPDATED: "recently_updated",
  FAVORITE_CHANGE: "favorite_change",
  NEW_MESSAGE: "new_message",
  SELLER_REPLY: "seller_reply",
  SAVED_VEHICLE_REMINDER: "saved_vehicle_reminder",
} as const;

export type AlertEventType =
  (typeof ALERT_EVENT_TYPE)[keyof typeof ALERT_EVENT_TYPE];
