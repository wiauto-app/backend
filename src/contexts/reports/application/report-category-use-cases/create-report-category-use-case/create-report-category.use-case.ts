import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { ReportCategory } from "../../../domain/entities/report-category";
import { ReportCategoryRepository } from "../../../domain/repositories/report-category.repository";
import { CreateReportCategoryDto } from "./create-report-category.dto";

@Injectable()
export class CreateReportCategoryUseCase {
  constructor(
    private readonly report_category_repository: ReportCategoryRepository,
  ) {}

  async execute(dto: CreateReportCategoryDto) {
    const report_category = ReportCategory.create({
      name: dto.name,
      target_type: dto.target_type,
    });
    const saved = await this.report_category_repository.save(report_category);
    return saved.toPrimitives();
  }
}
