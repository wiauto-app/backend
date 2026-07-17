import { Body, Controller, Patch, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { ReportCategoriesService } from "@/src/contexts/reports/services/report-categories.service";
import { AdminOnlyGuard } from "@/src/contexts/roles/guards/admin-only.guard";

import { V1_ADMIN_REPORT_CATEGORIES } from "../../route.constants";
import { UpdateReportCategoryHttpDto } from "./update-report-category.http-dto";

@Controller(V1_ADMIN_REPORT_CATEGORIES)
@UseGuards(JwtGuard, AdminOnlyGuard)
export class AdminUpdateReportCategoryController {
  constructor(
    private readonly report_categories_service: ReportCategoriesService,
  ) {}

  @Patch()
  run(@Body() body: UpdateReportCategoryHttpDto) {
    return this.report_categories_service.update(body.id, {
      name: body.name,
      target_type: body.target_type,
    });
  }
}
