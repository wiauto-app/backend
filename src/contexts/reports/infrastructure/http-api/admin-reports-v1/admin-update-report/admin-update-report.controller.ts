import { Body, Controller, Param, ParseUUIDPipe, Patch } from "@nestjs/common";

import { AdminUpdateReportUseCase } from "@/src/contexts/reports/application/report-use-cases/admin-update-report-use-case/admin-update-report.use-case";

import { V1_ADMIN_REPORTS } from "../../../route.constants";
import { AdminUpdateReportHttpDto } from "./admin-update-report.http-dto";

@Controller(V1_ADMIN_REPORTS)
export class AdminUpdateReportController {
  constructor(
    private readonly admin_update_report_use_case: AdminUpdateReportUseCase,
  ) {}

  @Patch(":id")
  run(
    @Param("id", ParseUUIDPipe) report_id: string,
    @Body() body: AdminUpdateReportHttpDto,
  ) {
    return this.admin_update_report_use_case.execute({
      report_id,
      status: body.status,
      admin_notes: body.admin_notes,
    });
  }
}
