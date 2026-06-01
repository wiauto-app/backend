import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { AdminFindReportUseCase } from "@/src/contexts/reports/application/report-use-cases/admin-find-report-use-case/admin-find-report.use-case";
import { AdminOnlyGuard } from "@/src/contexts/roles/guards/admin-only.guard";

import { V1_ADMIN_REPORTS } from "../../../route.constants";

@Controller(V1_ADMIN_REPORTS)
@UseGuards(JwtGuard, AdminOnlyGuard)
export class AdminFindReportController {
  constructor(
    private readonly admin_find_report_use_case: AdminFindReportUseCase,
  ) {}

  @Get(":id")
  run(@Param("id", ParseUUIDPipe) report_id: string) {
    return this.admin_find_report_use_case.execute({ report_id });
  }
}
