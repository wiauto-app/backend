import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
} from "class-validator";

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
  notify_saved_vehicle_reminders?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  saved_vehicle_reminder_days?: number;

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
}
