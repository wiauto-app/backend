import { ReportTargetType } from "../../../domain/entities/report-category";

export interface CreateReportDto {
  reporter_profile_id: string;
  title: string;
  description: string;
  category_id: string;
  file_url?: string | null;
  target_type: ReportTargetType;
  target_id: string;
}
