import { ReportTargetType } from "../../../domain/entities/report-category";

export interface UpdateReportCategoryDto {
  id: string;
  name?: string;
  target_type?: ReportTargetType;
}
