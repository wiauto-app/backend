import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { ReportCategoryNotFoundException } from "../../../domain/exceptions/report-category-not-found.exception";
import { ReportCategoryRepository } from "../../../domain/repositories/report-category.repository";
import { DeleteReportCategoryDto } from "./delete-report-category.dto";

@Injectable()
export class DeleteReportCategoryUseCase {
  constructor(
    private readonly report_category_repository: ReportCategoryRepository,
  ) {}

  async execute(dto: DeleteReportCategoryDto): Promise<void> {
    const existing = await this.report_category_repository.findOne(dto.id);
    if (!existing) {
      throw new ReportCategoryNotFoundException(dto.id);
    }
    await this.report_category_repository.delete(dto.id);
  }
}
