import { Body, Controller, Post, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { ReportCategoriesService } from "@/src/contexts/reports/services/report-categories.service";
import { AdminGuard } from "@/src/contexts/auth/guards/admin.guard";

import { V1_ADMIN_REPORT_CATEGORIES } from "../../route.constants";
import { CreateReportCategoryHttpDto } from "./create-report-category.http-dto";

@Controller(V1_ADMIN_REPORT_CATEGORIES)
@UseGuards(JwtGuard, AdminGuard)
export class AdminCreateReportCategoryController {
  constructor(
    private readonly report_categories_service: ReportCategoriesService,
  ) {}

  @Post()
  run(@Body() body: CreateReportCategoryHttpDto) {
    return this.report_categories_service.create(body);
  }
}
