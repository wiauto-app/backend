import { Controller, Get, Param, ParseUUIDPipe } from "@nestjs/common";

import { AdminFindReportUseCase } from "@/src/contexts/reports/application/report-use-cases/admin-find-report-use-case/admin-find-report.use-case";

import { V1_ADMIN_REPORTS } from "../../../route.constants";

@Controller(V1_ADMIN_REPORTS)
export class AdminFindReportController {
  constructor(
    private readonly admin_find_report_use_case: AdminFindReportUseCase,
  ) {}

  @Get(":id")
  run(@Param("id", ParseUUIDPipe) report_id: string) {
    return this.admin_find_report_use_case.execute({ report_id });
  }
}
