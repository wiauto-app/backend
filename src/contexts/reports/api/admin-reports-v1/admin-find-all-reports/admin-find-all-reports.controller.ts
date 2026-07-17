import { Controller, Get, Query, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { ReportsService } from "@/src/contexts/reports/services/reports.service";
import { AdminOnlyGuard } from "@/src/contexts/roles/guards/admin-only.guard";

import { V1_ADMIN_REPORTS } from "../../route.constants";
import { AdminFindAllReportsHttpDto } from "./admin-find-all-reports.http-dto";

@Controller(V1_ADMIN_REPORTS)
@UseGuards(JwtGuard, AdminOnlyGuard)
export class AdminFindAllReportsController {
  constructor(
    private readonly reports_service: ReportsService,
  ) {}

  @Get()
  run(@Query() query: AdminFindAllReportsHttpDto) {
    return this.reports_service.findAll(query);
  }
}
