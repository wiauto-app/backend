export const ALERT_NOTIFICATION_FREQUENCY = {
  INSTANT: "instant",
  DAILY: "daily",
  WEEKLY: "weekly",
} as const;

export type AlertNotificationFrequency =
  (typeof ALERT_NOTIFICATION_FREQUENCY)[keyof typeof ALERT_NOTIFICATION_FREQUENCY];
