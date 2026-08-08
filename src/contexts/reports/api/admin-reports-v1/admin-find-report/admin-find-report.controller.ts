import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { ReportsService } from "@/src/contexts/reports/services/reports.service";
import { AdminGuard } from "@/src/contexts/auth/guards/admin.guard";

import { V1_ADMIN_REPORTS } from "../../route.constants";

@Controller(V1_ADMIN_REPORTS)
@UseGuards(JwtGuard, AdminGuard)
export class AdminFindReportController {
  constructor(
    private readonly reports_service: ReportsService,
  ) {}

  @Get(":id")
  run(@Param("id", ParseUUIDPipe) report_id: string) {
    return this.reports_service.adminFindOne(report_id);
  }
}
