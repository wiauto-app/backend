import { IsBoolean, IsIn, IsOptional } from "class-validator";

import type { AlertNotificationFrequency } from "../../../types/alert-notification-frequency.enum";

export class UpdateAlertNotificationPreferencesHttpDto {
  @IsOptional()
  @IsBoolean()
  notify_new_matches?: boolean;

  @IsOptional()
  @IsBoolean()
  notify_price_drops?: boolean;

  @IsOptional()
  @IsBoolean()
  notify_favorite_changes?: boolean;

  @IsOptional()
  @IsBoolean()
  notify_new_messages?: boolean;

  @IsOptional()
  @IsBoolean()
  notify_seller_replies?: boolean;

  @IsOptional()
  @IsBoolean()
  notify_new_leads?: boolean;

  @IsOptional()
  @IsIn(["instant", "daily", "weekly"])
  frequency?: AlertNotificationFrequency;

  @IsOptional()
  @IsBoolean()
  channel_email?: boolean;

  @IsOptional()
  @IsBoolean()
  channel_push?: boolean;

  @IsOptional()
  @IsBoolean()
  channel_sms?: boolean;

  @IsOptional()
  @IsBoolean()
  channel_in_app?: boolean;

  @IsOptional()
  @IsBoolean()
  channel_whatsapp?: boolean;
}
