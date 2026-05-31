import { Controller, Get, Query } from "@nestjs/common";

import { FindAllReportCategoriesUseCase } from "@/src/contexts/reports/application/report-category-use-cases/find-all-report-categories-use-case/find-all-report-categories.use-case";

import { V1_REPORT_CATEGORIES } from "../../../route.constants";
import { FindAllReportCategoriesHttpDto } from "./find-all-report-categories.http-dto";

@Controller(V1_REPORT_CATEGORIES)
export class FindAllReportCategoriesController {
  constructor(
    private readonly find_all_report_categories_use_case: FindAllReportCategoriesUseCase,
  ) {}

  @Get()
  run(@Query() query: FindAllReportCategoriesHttpDto) {
    return this.find_all_report_categories_use_case.execute(query);
  }
}
