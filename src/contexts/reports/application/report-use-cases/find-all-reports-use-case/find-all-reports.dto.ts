import { ReportFilterOptions } from "../../../domain/filters/report.filter";

export interface FindAllReportsDto extends ReportFilterOptions {
  reporter_profile_id: string;
}
