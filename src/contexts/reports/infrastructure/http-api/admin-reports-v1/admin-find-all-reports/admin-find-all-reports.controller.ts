import { Controller, Get, Query } from "@nestjs/common";

import { AdminFindAllReportsUseCase } from "@/src/contexts/reports/application/report-use-cases/admin-find-all-reports-use-case/admin-find-all-reports.use-case";

import { V1_ADMIN_REPORTS } from "../../../route.constants";
import { AdminFindAllReportsHttpDto } from "./admin-find-all-reports.http-dto";

@Controller(V1_ADMIN_REPORTS)
export class AdminFindAllReportsController {
  constructor(
    private readonly admin_find_all_reports_use_case: AdminFindAllReportsUseCase,
  ) {}

  @Get()
  run(@Query() query: AdminFindAllReportsHttpDto) {
    return this.admin_find_all_reports_use_case.execute(query);
  }
}
