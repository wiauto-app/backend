import { Body, Controller, Param, ParseUUIDPipe, Patch, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { ReportsService } from "@/src/contexts/reports/services/reports.service";
import { AdminOnlyGuard } from "@/src/contexts/roles/guards/admin-only.guard";

import { V1_ADMIN_REPORTS } from "../../route.constants";
import { AdminUpdateReportHttpDto } from "./admin-update-report.http-dto";

@Controller(V1_ADMIN_REPORTS)
@UseGuards(JwtGuard, AdminOnlyGuard)
export class AdminUpdateReportController {
  constructor(
    private readonly reports_service: ReportsService,
  ) {}

  @Patch(":id")
  run(
    @Param("id", ParseUUIDPipe) report_id: string,
    @Body() body: AdminUpdateReportHttpDto,
  ) {
    return this.reports_service.adminUpdate({
      report_id,
      status: body.status,
      admin_notes: body.admin_notes,
    });
  }
}
