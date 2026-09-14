import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateIf } from "class-validator";

import { ReportTargetType } from "@/src/contexts/reports/types/report-category";

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

  @ValidateIf(
    (dto: AdminCreateReportHttpDto) =>
      dto.target_type === ReportTargetType.ASSISTANT_MESSAGE,
  )
  @IsString()
  @IsNotEmpty()
  target_assistant_message_id?: string;
}
