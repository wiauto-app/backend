import { Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from "class-validator";

import {
  PLAN_LEAD_STATUS,
  PRICE_INTERVAL,
  PlanLeadStatus,
  PriceInterval,
} from "../../../types/billing.enums";
import { PlanEntitlementItemHttpDto } from "../plan-versions/replace-plan-entitlements.http-dto";

export class UpdatePlanLeadRequestHttpDto {
  @IsOptional()
  @IsEnum(PLAN_LEAD_STATUS)
  status?: PlanLeadStatus;

  @IsOptional()
  @IsUUID()
  base_plan_id?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  proposed_price_cents?: number | null;

  @IsOptional()
  @IsEnum(PRICE_INTERVAL)
  proposed_interval?: PriceInterval | null;

  @IsOptional()
  @IsString()
  proposal_notes?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanEntitlementItemHttpDto)
  proposed_overrides?: PlanEntitlementItemHttpDto[];
}

export class CreatePlanLeadProposalHttpDto {
  @IsUUID()
  base_plan_id!: string;

  @IsInt()
  @Min(100)
  proposed_price_cents!: number;

  @IsEnum(PRICE_INTERVAL)
  proposed_interval!: PriceInterval;

  @IsOptional()
  @IsString()
  proposal_notes?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanEntitlementItemHttpDto)
  proposed_overrides?: PlanEntitlementItemHttpDto[];
}
