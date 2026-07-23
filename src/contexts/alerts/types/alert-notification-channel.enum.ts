export const ALERT_NOTIFICATION_CHANNEL = {
  EMAIL: "email",
  PUSH: "push",
  SMS: "sms",
  IN_APP: "in_app",
  WHATSAPP: "whatsapp",
} as const;

export type AlertNotificationChannel =
  (typeof ALERT_NOTIFICATION_CHANNEL)[keyof typeof ALERT_NOTIFICATION_CHANNEL];
