import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

import { ReportTargetType } from "@/src/contexts/reports/domain/entities/report-category";

export class AdminCreateReportHttpDto {
  @IsOptional()
  @IsUUID("4")
  reporter_profile_id?: string;

  @IsUUID("4")
  @IsNotEmpty()
  category_id: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsString()
  file_url?: string | null;

  @IsEnum(ReportTargetType)
  target_type: ReportTargetType;

  @IsUUID("4")
  @IsNotEmpty()
  target_id: string;
}
