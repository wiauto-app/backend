import { Type } from "class-transformer";
import { IsDateString, IsIn, IsInt, IsOptional, Max, Min } from "class-validator";

import { LEAD_TIERS } from "../../../types/lead-scoring";

export class FindSellerLeadsHttpDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsIn(["asc", "desc"])
  sort?: "asc" | "desc" = "desc";

  @IsOptional()
  @IsIn(["date", "score"])
  sort_by?: "date" | "score";

  @IsOptional()
  @IsIn([...LEAD_TIERS])
  tier?: (typeof LEAD_TIERS)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
