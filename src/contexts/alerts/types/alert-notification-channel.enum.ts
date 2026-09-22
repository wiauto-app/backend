export const ALERT_NOTIFICATION_CHANNEL = {
  EMAIL: "email",
  PUSH: "push",
  SMS: "sms",
  IN_APP: "in_app",
  WHATSAPP: "whatsapp",
} as const;

export type AlertNotificationChannel =
  (typeof ALERT_NOTIFICATION_CHANNEL)[keyof typeof ALERT_NOTIFICATION_CHANNEL];

/** Channels a saved-search alert can use right now. */
export const ENABLED_ALERT_NOTIFICATION_CHANNELS: AlertNotificationChannel[] = [
  ALERT_NOTIFICATION_CHANNEL.EMAIL,
  ALERT_NOTIFICATION_CHANNEL.PUSH,
  ALERT_NOTIFICATION_CHANNEL.IN_APP,
];

/** Default delivery methods for a newly created saved-search alert. */
export const DEFAULT_ALERT_NOTIFICATION_CHANNELS: AlertNotificationChannel[] =
  ENABLED_ALERT_NOTIFICATION_CHANNELS;

export const keepEnabledAlertChannels = (
  channels: readonly AlertNotificationChannel[] | undefined,
): AlertNotificationChannel[] => {
  const enabled = (channels ?? []).filter((channel) =>
    ENABLED_ALERT_NOTIFICATION_CHANNELS.includes(channel),
  );

  return enabled.length > 0 ? enabled : [...DEFAULT_ALERT_NOTIFICATION_CHANNELS];
};
