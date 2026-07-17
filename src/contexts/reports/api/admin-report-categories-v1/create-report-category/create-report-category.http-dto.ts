import { IsEnum, IsNotEmpty, IsString } from "class-validator";

import { ReportTargetType } from "@/src/contexts/reports/types/report-category";

export class CreateReportCategoryHttpDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(ReportTargetType)
  target_type: ReportTargetType;
}
