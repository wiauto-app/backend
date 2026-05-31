import { ReportTargetType } from "../../../domain/entities/report-category";

export interface CreateReportCategoryDto {
  name: string;
  target_type: ReportTargetType;
}
