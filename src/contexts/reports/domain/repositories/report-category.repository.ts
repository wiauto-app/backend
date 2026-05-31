import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { ReportCategory } from "../entities/report-category";
import { ReportCategoryFilter } from "../filters/report-category.filter";

export abstract class ReportCategoryRepository {
  abstract findOne(id: string): Promise<ReportCategory | null>;
  abstract find_all(
    filter: ReportCategoryFilter,
  ): Promise<PaginatedResult<ReportCategory>>;
  abstract save(report_category: ReportCategory): Promise<ReportCategory>;
  abstract update(report_category: ReportCategory): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
