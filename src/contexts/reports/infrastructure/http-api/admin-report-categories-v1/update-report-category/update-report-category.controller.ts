import { Body, Controller, Patch, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { UpdateReportCategoryUseCase } from "@/src/contexts/reports/application/report-category-use-cases/update-report-category-use-case/update-report-category.use-case";
import { AdminOnlyGuard } from "@/src/contexts/roles/guards/admin-only.guard";

import { V1_ADMIN_REPORT_CATEGORIES } from "../../../route.constants";
import { UpdateReportCategoryHttpDto } from "./update-report-category.http-dto";

@Controller(V1_ADMIN_REPORT_CATEGORIES)
@UseGuards(JwtGuard, AdminOnlyGuard)
export class AdminUpdateReportCategoryController {
  constructor(
    private readonly update_report_category_use_case: UpdateReportCategoryUseCase,
  ) {}

  @Patch()
  run(@Body() body: UpdateReportCategoryHttpDto) {
    return this.update_report_category_use_case.execute(body);
  }
}
