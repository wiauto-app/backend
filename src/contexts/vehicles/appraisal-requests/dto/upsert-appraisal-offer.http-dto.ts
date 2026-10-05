import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class UpsertAppraisalOfferHttpDto {
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(10_000_000)
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;
}
