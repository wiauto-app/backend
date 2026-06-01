import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { FindReportCategoryUseCase } from "@/src/contexts/reports/application/report-category-use-cases/find-report-category-use-case/find-report-category.use-case";
import { AdminOnlyGuard } from "@/src/contexts/roles/guards/admin-only.guard";

import { V1_ADMIN_REPORT_CATEGORIES } from "../../../route.constants";

@Controller(V1_ADMIN_REPORT_CATEGORIES)
@UseGuards(JwtGuard, AdminOnlyGuard)
export class AdminFindReportCategoryController {
  constructor(
    private readonly find_report_category_use_case: FindReportCategoryUseCase,
  ) {}

  @Get(":id")
  run(@Param("id", ParseUUIDPipe) id: string) {
    return this.find_report_category_use_case.execute({ id });
  }
}
