import { Controller, Get, Param, ParseUUIDPipe } from "@nestjs/common";

import { FindReportCategoryUseCase } from "@/src/contexts/reports/application/report-category-use-cases/find-report-category-use-case/find-report-category.use-case";

import { V1_ADMIN_REPORT_CATEGORIES } from "../../../route.constants";

@Controller(V1_ADMIN_REPORT_CATEGORIES)
export class AdminFindReportCategoryController {
  constructor(
    private readonly find_report_category_use_case: FindReportCategoryUseCase,
  ) {}

  @Get(":id")
  run(@Param("id", ParseUUIDPipe) id: string) {
    return this.find_report_category_use_case.execute({ id });
  }
}
