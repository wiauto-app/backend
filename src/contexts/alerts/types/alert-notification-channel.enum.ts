export const ALERT_NOTIFICATION_CHANNEL = {
  EMAIL: "email",
  PUSH: "push",
  SMS: "sms",
  IN_APP: "in_app",
  WHATSAPP: "whatsapp",
} as const;

export type AlertNotificationChannel =
  (typeof ALERT_NOTIFICATION_CHANNEL)[keyof typeof ALERT_NOTIFICATION_CHANNEL];

/** Default delivery methods for a newly created saved-search alert. */
export const DEFAULT_ALERT_NOTIFICATION_CHANNELS: AlertNotificationChannel[] = [
  ALERT_NOTIFICATION_CHANNEL.EMAIL,
  ALERT_NOTIFICATION_CHANNEL.IN_APP,
];
