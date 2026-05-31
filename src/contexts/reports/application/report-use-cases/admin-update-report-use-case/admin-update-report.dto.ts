import { ReportStatus } from "../../../domain/entities/report";

export interface AdminUpdateReportDto {
  report_id: string;
  status?: ReportStatus;
  admin_notes?: string | null;
}
