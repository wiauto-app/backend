import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { ReportNotFoundException } from "../../../domain/exceptions/report-not-found.exception";
import { ReportListItem } from "../../../domain/read-models/report-list-item";
import { ReportRepository } from "../../../domain/repositories/report.repository";
import { AdminFindReportDto } from "./admin-find-report.dto";

@Injectable()
export class AdminFindReportUseCase {
  constructor(private readonly report_repository: ReportRepository) {}

  async execute(dto: AdminFindReportDto): Promise<ReportListItem> {
    const report = await this.report_repository.findOne(dto.report_id);
    if (!report) {
      throw new ReportNotFoundException(dto.report_id);
    }
    return report;
  }
}
