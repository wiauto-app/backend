import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { PrimitiveReportCategory } from "../../../domain/entities/report-category";
import { ReportCategoryFilter } from "../../../domain/filters/report-category.filter";
import { ReportCategoryRepository } from "../../../domain/repositories/report-category.repository";
import { FindAllReportCategoriesDto } from "./find-all-report-categories.dto";

@Injectable()
export class FindAllReportCategoriesUseCase {
  constructor(
    private readonly report_category_repository: ReportCategoryRepository,
  ) {}

  async execute(
    dto: FindAllReportCategoriesDto,
  ): Promise<PaginatedResult<PrimitiveReportCategory>> {
    const filter = new ReportCategoryFilter({ ...dto });
    const page = await this.report_category_repository.find_all(filter);
    return page.map((report_category) => report_category.toPrimitives());
  }
}
