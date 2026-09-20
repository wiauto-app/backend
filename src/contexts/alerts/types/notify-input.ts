import type { AlertNotificationChannel } from "./alert-notification-channel.enum";
import type { PushType } from "./push-message";

export interface NotifyInput {
  profile_id: string | null;
  category: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  email_override?: string;
  /** Explicit channels for a saved-search alert. Omitting it uses account preferences. */
  channels_override?: readonly AlertNotificationChannel[];
  /**
   * Channels to skip for this delivery (e.g. `push` when the recipient already has the chat
   * open). Explicit field on purpose: `data` is persisted in `notifications.data`.
   */
  exclude_channels?: readonly AlertNotificationChannel[];
  /** Overrides the push type derived from `category` (e.g. support chat messages). */
  push_type?: PushType;
}

export interface NotificationEmailChannelInput {
  to: string;
  profile_id: string | null;
  category: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}
