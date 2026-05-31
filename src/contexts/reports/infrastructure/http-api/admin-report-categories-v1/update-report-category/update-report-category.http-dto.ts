import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

import { ReportTargetType } from "@/src/contexts/reports/domain/entities/report-category";

export class UpdateReportCategoryHttpDto {
  @IsNotEmpty()
  @IsUUID("4")
  id: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsEnum(ReportTargetType)
  target_type?: ReportTargetType;
}
