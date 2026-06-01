import { Controller, Delete, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { DeleteReportUseCase } from "@/src/contexts/reports/application/report-use-cases/delete-report-use-case/delete-report.use-case";
import { AdminOnlyGuard } from "@/src/contexts/roles/guards/admin-only.guard";

import { V1_ADMIN_REPORTS } from "../../../route.constants";

@Controller(V1_ADMIN_REPORTS)
@UseGuards(JwtGuard, AdminOnlyGuard)
export class AdminDeleteReportController {
  constructor(private readonly delete_report_use_case: DeleteReportUseCase) {}

  @Delete(":id")
  run(@Param("id", ParseUUIDPipe) report_id: string) {
    return this.delete_report_use_case.execute({ report_id });
  }
}
