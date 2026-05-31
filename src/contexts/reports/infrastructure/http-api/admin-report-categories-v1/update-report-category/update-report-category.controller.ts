import { Body, Controller, Patch } from "@nestjs/common";

import { UpdateReportCategoryUseCase } from "@/src/contexts/reports/application/report-category-use-cases/update-report-category-use-case/update-report-category.use-case";

import { V1_ADMIN_REPORT_CATEGORIES } from "../../../route.constants";
import { UpdateReportCategoryHttpDto } from "./update-report-category.http-dto";

@Controller(V1_ADMIN_REPORT_CATEGORIES)
export class AdminUpdateReportCategoryController {
  constructor(
    private readonly update_report_category_use_case: UpdateReportCategoryUseCase,
  ) {}

  @Patch()
  run(@Body() body: UpdateReportCategoryHttpDto) {
    return this.update_report_category_use_case.execute(body);
  }
}
