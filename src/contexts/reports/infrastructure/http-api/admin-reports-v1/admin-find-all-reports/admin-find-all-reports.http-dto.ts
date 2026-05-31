import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

import { ReportStatus } from "@/src/contexts/reports/domain/entities/report";
import { ReportTargetType } from "@/src/contexts/reports/domain/entities/report-category";

export class AdminFindAllReportsHttpDto {
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
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @IsOptional()
  @IsEnum(ReportTargetType)
  target_type?: ReportTargetType;

  @IsOptional()
  @IsUUID("4")
  category_id?: string;
}
