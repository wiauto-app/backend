export const ALERT_NOTIFICATION_EVENT_STATUS = {
  PENDING: "pending",
  SENT: "sent",
  SKIPPED: "skipped",
} as const;

export type AlertNotificationEventStatus =
  (typeof ALERT_NOTIFICATION_EVENT_STATUS)[keyof typeof ALERT_NOTIFICATION_EVENT_STATUS];
