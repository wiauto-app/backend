import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { Report } from "../entities/report";
import { ReportFilter } from "../filters/report.filter";
import { ReportListItem } from "../read-models/report-list-item";

export abstract class ReportRepository {
  abstract findOne(id: string): Promise<ReportListItem | null>;
  abstract find_all(
    filter: ReportFilter,
  ): Promise<PaginatedResult<ReportListItem>>;
  abstract save(report: Report): Promise<Report>;
  abstract update(report: Report): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
