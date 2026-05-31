import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { ReportCategoryNotFoundException } from "../../../domain/exceptions/report-category-not-found.exception";
import { ReportCategoryRepository } from "../../../domain/repositories/report-category.repository";
import { UpdateReportCategoryDto } from "./update-report-category.dto";

@Injectable()
export class UpdateReportCategoryUseCase {
  constructor(
    private readonly report_category_repository: ReportCategoryRepository,
  ) {}

  async execute(dto: UpdateReportCategoryDto) {
    const existing = await this.report_category_repository.findOne(dto.id);
    if (!existing) {
      throw new ReportCategoryNotFoundException(dto.id);
    }

    const updated = existing.update({
      name: dto.name,
      target_type: dto.target_type,
    });
    await this.report_category_repository.update(updated);
    return updated.toPrimitives();
  }
}
