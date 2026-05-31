import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { ReportFilter } from "../../../domain/filters/report.filter";
import { ReportListItem } from "../../../domain/read-models/report-list-item";
import { ReportRepository } from "../../../domain/repositories/report.repository";
import { AdminFindAllReportsDto } from "./admin-find-all-reports.dto";

@Injectable()
export class AdminFindAllReportsUseCase {
  constructor(private readonly report_repository: ReportRepository) {}

  async execute(
    dto: AdminFindAllReportsDto,
  ): Promise<PaginatedResult<ReportListItem>> {
    const filter = new ReportFilter({ ...dto });
    return this.report_repository.find_all(filter);
  }
}
