import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { ReportCategoriesService } from "@/src/contexts/reports/services/report-categories.service";
import { AdminOnlyGuard } from "@/src/contexts/roles/guards/admin-only.guard";

import { V1_ADMIN_REPORT_CATEGORIES } from "../../route.constants";

@Controller(V1_ADMIN_REPORT_CATEGORIES)
@UseGuards(JwtGuard, AdminOnlyGuard)
export class AdminFindReportCategoryController {
  constructor(
    private readonly report_categories_service: ReportCategoriesService,
  ) {}

  @Get(":id")
  run(@Param("id", ParseUUIDPipe) id: string) {
    return this.report_categories_service.findOne(id);
  }
}
