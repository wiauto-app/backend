import { Controller, Delete, Param } from "@nestjs/common";

import { DeleteReportCategoryUseCase } from "@/src/contexts/reports/application/report-category-use-cases/delete-report-category-use-case/delete-report-category.use-case";

import { V1_ADMIN_REPORT_CATEGORIES } from "../../../route.constants";
import { FindReportCategoryHttpDto } from "../find-report-category/find-report-category.http-dto";

@Controller(V1_ADMIN_REPORT_CATEGORIES)
export class AdminDeleteReportCategoryController {
  constructor(
    private readonly delete_report_category_use_case: DeleteReportCategoryUseCase,
  ) {}

  @Delete(":id")
  run(@Param() params: FindReportCategoryHttpDto) {
    return this.delete_report_category_use_case.execute({ id: params.id });
  }
}
