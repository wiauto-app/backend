import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class RespondAppraisalRequestHttpDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  estimated_price_min!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  estimated_price_max!: number;

  @IsOptional()
  @IsString()
  admin_note?: string;
}
