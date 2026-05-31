import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { ReportForbiddenException } from "../../../domain/exceptions/report-forbidden.exception";
import { ReportNotFoundException } from "../../../domain/exceptions/report-not-found.exception";
import { ReportListItem } from "../../../domain/read-models/report-list-item";
import { ReportRepository } from "../../../domain/repositories/report.repository";
import { FindReportDto } from "./find-report.dto";

@Injectable()
export class FindReportUseCase {
  constructor(private readonly report_repository: ReportRepository) {}

  async execute(dto: FindReportDto): Promise<ReportListItem> {
    const report = await this.report_repository.findOne(dto.report_id);
    if (!report) {
      throw new ReportNotFoundException(dto.report_id);
    }
    if (report.reporter_profile_id !== dto.reporter_profile_id) {
      throw new ReportForbiddenException();
    }
    return report;
  }
}
