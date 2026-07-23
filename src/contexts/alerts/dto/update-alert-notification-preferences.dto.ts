import type { AlertNotificationFrequency } from "../types/alert-notification-frequency.enum";

export interface UpdateAlertNotificationPreferencesDto {
  profile_id: string;
  notify_new_matches?: boolean;
  notify_price_drops?: boolean;
  notify_favorite_changes?: boolean;
  notify_new_messages?: boolean;
  notify_seller_replies?: boolean;
  notify_saved_vehicle_reminders?: boolean;
  notify_new_leads?: boolean;
  saved_vehicle_reminder_days?: number;
  frequency?: AlertNotificationFrequency;
  channel_email?: boolean;
  channel_push?: boolean;
  channel_sms?: boolean;
  channel_in_app?: boolean;
  channel_whatsapp?: boolean;
}
