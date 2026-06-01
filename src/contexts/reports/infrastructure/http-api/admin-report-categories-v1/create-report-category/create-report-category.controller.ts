import { Body, Controller, Post, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { CreateReportCategoryUseCase } from "@/src/contexts/reports/application/report-category-use-cases/create-report-category-use-case/create-report-category.use-case";
import { AdminOnlyGuard } from "@/src/contexts/roles/guards/admin-only.guard";

import { V1_ADMIN_REPORT_CATEGORIES } from "../../../route.constants";
import { CreateReportCategoryHttpDto } from "./create-report-category.http-dto";

@Controller(V1_ADMIN_REPORT_CATEGORIES)
@UseGuards(JwtGuard, AdminOnlyGuard)
export class AdminCreateReportCategoryController {
  constructor(
    private readonly create_report_category_use_case: CreateReportCategoryUseCase,
  ) {}

  @Post()
  run(@Body() body: CreateReportCategoryHttpDto) {
    return this.create_report_category_use_case.execute(body);
  }
}
