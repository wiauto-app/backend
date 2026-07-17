import { Controller, Delete, Param, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { ReportCategoriesService } from "@/src/contexts/reports/services/report-categories.service";
import { AdminOnlyGuard } from "@/src/contexts/roles/guards/admin-only.guard";

import { V1_ADMIN_REPORT_CATEGORIES } from "../../route.constants";
import { FindReportCategoryHttpDto } from "../find-report-category/find-report-category.http-dto";

@Controller(V1_ADMIN_REPORT_CATEGORIES)
@UseGuards(JwtGuard, AdminOnlyGuard)
export class AdminDeleteReportCategoryController {
  constructor(
    private readonly report_categories_service: ReportCategoriesService,
  ) {}

  @Delete(":id")
  run(@Param() params: FindReportCategoryHttpDto) {
    return this.report_categories_service.remove(params.id);
  }
}
