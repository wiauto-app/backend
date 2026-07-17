import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

import { AlertFiltersHttpDto } from "../alert-filters.http-dto";

export class UpdateAlertHttpDto extends AlertFiltersHttpDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsBoolean()
  notify_new_listings?: boolean;

  @IsOptional()
  @IsBoolean()
  notify_price_drops?: boolean;

  @IsOptional()
  @IsBoolean()
  notify_sold_removed?: boolean;

  @IsOptional()
  @IsBoolean()
  notify_featured?: boolean;

  @IsOptional()
  @IsBoolean()
  notify_recently_updated?: boolean;
}
