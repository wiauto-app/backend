import type { AlertNotificationChannel } from "./alert-notification-channel.enum";

export interface NotifyInput {
  profile_id: string | null;
  category: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  email_override?: string;
  /** Explicit channels for a saved-search alert. Omitting it uses account preferences. */
  channels_override?: readonly AlertNotificationChannel[];
}

export interface NotificationEmailChannelInput {
  to: string;
  profile_id: string | null;
  category: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}
