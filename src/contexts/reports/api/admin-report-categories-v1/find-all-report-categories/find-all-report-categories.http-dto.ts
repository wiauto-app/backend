import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

import { ReportTargetType } from "@/src/contexts/reports/types/report-category";

export class AdminFindAllReportCategoriesHttpDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;

  @IsOptional()
  @IsString()
  order_by?: string;

  @IsOptional()
  @IsEnum(["ASC", "DESC"])
  order_direction: "ASC" | "DESC" = "DESC";

  @IsOptional()
  @IsEnum(ReportTargetType)
  target_type?: ReportTargetType;
}
