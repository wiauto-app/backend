import { IsArray, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";

import { AlertFiltersHttpDto } from "../alert-filters.http-dto";
import type { AlertNotificationChannel } from "../../../types/alert-notification-channel.enum";

export class CreateAlertHttpDto extends AlertFiltersHttpDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  phone?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  phone_code?: string;

  @IsOptional()
  @IsArray()
  @IsIn(["email", "push", "sms", "in_app", "whatsapp"], { each: true })
  notification_channels?: AlertNotificationChannel[];
}
