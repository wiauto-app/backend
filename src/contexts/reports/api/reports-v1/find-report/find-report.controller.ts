import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { ReportsService } from "@/src/contexts/reports/services/reports.service";

import { V1_REPORTS } from "../../route.constants";

@Controller(V1_REPORTS)
@UseGuards(JwtGuard)
export class FindReportController {
  constructor(private readonly reports_service: ReportsService) {}

  @Get(":id")
  run(
    @GetUserId() reporter_profile_id: string,
    @Param("id", ParseUUIDPipe) report_id: string,
  ) {
    return this.reports_service.findOne({
      report_id,
      reporter_profile_id,
    });
  }
}
