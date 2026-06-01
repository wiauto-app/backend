import { Controller, Get, Query, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { AdminFindAllReportsUseCase } from "@/src/contexts/reports/application/report-use-cases/admin-find-all-reports-use-case/admin-find-all-reports.use-case";
import { AdminOnlyGuard } from "@/src/contexts/roles/guards/admin-only.guard";

import { V1_ADMIN_REPORTS } from "../../../route.constants";
import { AdminFindAllReportsHttpDto } from "./admin-find-all-reports.http-dto";

@Controller(V1_ADMIN_REPORTS)
@UseGuards(JwtGuard, AdminOnlyGuard)
export class AdminFindAllReportsController {
  constructor(
    private readonly admin_find_all_reports_use_case: AdminFindAllReportsUseCase,
  ) {}

  @Get()
  run(@Query() query: AdminFindAllReportsHttpDto) {
    return this.admin_find_all_reports_use_case.execute(query);
  }
}
