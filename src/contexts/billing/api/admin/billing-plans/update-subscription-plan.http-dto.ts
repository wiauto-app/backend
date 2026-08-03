import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
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
} from "../../../types/billing.enums";

import { PlanFeatureHttpDto } from "./plan-feature.http-dto";
import { PlanPriceHttpDto } from "./plan-price.http-dto";
import {
  normalizePlanEffectConfig,
  PlanEffectConfigHttpDto,
} from "./plan-effect-config.http-dto";
import { PlanQuotasHttpDto } from "./plan-quotas.http-dto";

export { normalizePlanEffectConfig };

export class UpdateSubscriptionPlanHttpDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsEnum(PLAN_AUDIENCE)
  audience?: PlanAudience;

  @IsOptional()
  @IsEnum(BILLING_TYPE)
  billing_type?: BillingType;

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
  @IsBoolean()
  is_custom?: boolean;

  @IsOptional()
  @IsUUID()
  target_dealership_id?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => PlanQuotasHttpDto)
  quotas?: PlanQuotasHttpDto;

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

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PlanEffectConfigHttpDto)
  effect_config?: PlanEffectConfigHttpDto;
}
