import { Controller, Get, Query, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { ReportCategoriesService } from "@/src/contexts/reports/services/report-categories.service";
import { AdminOnlyGuard } from "@/src/contexts/roles/guards/admin-only.guard";

import { V1_ADMIN_REPORT_CATEGORIES } from "../../route.constants";
import { AdminFindAllReportCategoriesHttpDto } from "./find-all-report-categories.http-dto";

@Controller(V1_ADMIN_REPORT_CATEGORIES)
@UseGuards(JwtGuard, AdminOnlyGuard)
export class AdminFindAllReportCategoriesController {
  constructor(
    private readonly report_categories_service: ReportCategoriesService,
  ) {}

  @Get()
  run(@Query() query: AdminFindAllReportCategoriesHttpDto) {
    return this.report_categories_service.findAll(query);
  }
}
