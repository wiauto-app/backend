import { IsEnum, IsOptional, IsString } from "class-validator";

import { ReportStatus } from "@/src/contexts/reports/types/report";

export class AdminUpdateReportHttpDto {
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @IsOptional()
  @IsString()
  admin_notes?: string | null;
}
