import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { ReportCategoryNotFoundException } from "../../../domain/exceptions/report-category-not-found.exception";
import { ReportCategoryRepository } from "../../../domain/repositories/report-category.repository";
import { FindReportCategoryDto } from "./find-report-category.dto";

@Injectable()
export class FindReportCategoryUseCase {
  constructor(
    private readonly report_category_repository: ReportCategoryRepository,
  ) {}

  async execute(dto: FindReportCategoryDto) {
    const report_category = await this.report_category_repository.findOne(dto.id);
    if (!report_category) {
      throw new ReportCategoryNotFoundException(dto.id);
    }
    return report_category.toPrimitives();
  }
}
