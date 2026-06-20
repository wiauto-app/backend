import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from "class-validator";

import {
  BILLING_TYPE,
  BillingType,
  PLAN_AUDIENCE,
  PlanAudience,
} from "../../../../domain/enums/billing.enums";

import { PlanFeatureHttpDto } from "./plan-feature.http-dto";
import { PlanPriceHttpDto } from "./plan-price.http-dto";

export class CreateSubscriptionPlanHttpDto {
  @IsString()
  slug!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsEnum(PLAN_AUDIENCE)
  audience!: PlanAudience;

  @IsEnum(BILLING_TYPE)
  billing_type!: BillingType;

  @IsOptional()
  @IsUUID()
  role_id?: string | null;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsBoolean()
  is_featured?: boolean;

  @IsOptional()
  @IsInt()
  sort_order?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanPriceHttpDto)
  prices?: PlanPriceHttpDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanFeatureHttpDto)
  features?: PlanFeatureHttpDto[];
}
