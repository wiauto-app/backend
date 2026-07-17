import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";

import { PRICE_INTERVAL, PriceInterval } from "../../../types/billing.enums";

export class PlanPriceHttpDto {
  @IsEnum(PRICE_INTERVAL)
  interval!: PriceInterval;

  @IsInt()
  @Min(0)
  amount_cents!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
