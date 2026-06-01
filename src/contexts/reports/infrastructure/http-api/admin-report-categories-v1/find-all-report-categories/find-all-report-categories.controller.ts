import { Controller, Get, Query, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { FindAllReportCategoriesUseCase } from "@/src/contexts/reports/application/report-category-use-cases/find-all-report-categories-use-case/find-all-report-categories.use-case";
import { AdminOnlyGuard } from "@/src/contexts/roles/guards/admin-only.guard";

import { V1_ADMIN_REPORT_CATEGORIES } from "../../../route.constants";
import { AdminFindAllReportCategoriesHttpDto } from "./find-all-report-categories.http-dto";

@Controller(V1_ADMIN_REPORT_CATEGORIES)
@UseGuards(JwtGuard, AdminOnlyGuard)
export class AdminFindAllReportCategoriesController {
  constructor(
    private readonly find_all_report_categories_use_case: FindAllReportCategoriesUseCase,
  ) {}

  @Get()
  run(@Query() query: AdminFindAllReportCategoriesHttpDto) {
    return this.find_all_report_categories_use_case.execute(query);
  }
}
