import { Body, Controller, Post } from "@nestjs/common";

import { CreateReportCategoryUseCase } from "@/src/contexts/reports/application/report-category-use-cases/create-report-category-use-case/create-report-category.use-case";

import { V1_ADMIN_REPORT_CATEGORIES } from "../../../route.constants";
import { CreateReportCategoryHttpDto } from "./create-report-category.http-dto";

@Controller(V1_ADMIN_REPORT_CATEGORIES)
export class AdminCreateReportCategoryController {
  constructor(
    private readonly create_report_category_use_case: CreateReportCategoryUseCase,
  ) {}

  @Post()
  run(@Body() body: CreateReportCategoryHttpDto) {
    return this.create_report_category_use_case.execute(body);
  }
}
