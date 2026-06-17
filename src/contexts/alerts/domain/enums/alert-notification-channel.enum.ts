export const ALERT_NOTIFICATION_CHANNEL = {
  EMAIL: "email",
  PUSH: "push",
  SMS: "sms",
} as const;

export type AlertNotificationChannel =
  (typeof ALERT_NOTIFICATION_CHANNEL)[keyof typeof ALERT_NOTIFICATION_CHANNEL];
