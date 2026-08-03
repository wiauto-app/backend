import { Type } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from "class-validator";

export class PlanQuotasHttpDto {
  @IsInt()
  @Min(0)
  max_listings!: number;

  @IsInt()
  @Min(0)
  max_photos!: number;

  @IsBoolean()
  allow_videos!: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  featured_monthly?: number;
}

export class OptionalPlanQuotasHttpDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => PlanQuotasHttpDto)
  quotas?: PlanQuotasHttpDto;
}
