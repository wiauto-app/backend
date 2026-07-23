export interface NotifyInput {
  profile_id: string;
  category: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  email_override?: string;
}

export interface NotificationEmailChannelInput {
  to: string;
  profile_id: string;
  category: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}
