import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";
import { OmitType } from "@nestjs/mapped-types";

import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";

export class FindFeaturesHttpDto extends OmitType(PaginationHttpDto, [
  "limit",
] as const) {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit = 10;
}
