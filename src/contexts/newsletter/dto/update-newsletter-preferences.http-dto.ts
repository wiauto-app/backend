import { IsArray, IsBoolean, IsOptional, IsString } from "class-validator";

export class UpdateNewsletterPreferencesHttpDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  enabled_category_slugs?: string[];

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
