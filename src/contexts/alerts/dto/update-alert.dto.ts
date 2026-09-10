import { AlertFiltersDto } from "./alert-filters.dto";
import type { AlertNotificationChannel } from "../types/alert-notification-channel.enum";

export class UpdateAlertDto extends AlertFiltersDto {
  alert_id: string;
  profile_id: string;
  name?: string;
  is_active?: boolean;
  notify_new_listings?: boolean;
  notify_price_drops?: boolean;
  notify_sold_removed?: boolean;
  notify_featured?: boolean;
  notify_recently_updated?: boolean;
  notification_channels?: AlertNotificationChannel[];
}
