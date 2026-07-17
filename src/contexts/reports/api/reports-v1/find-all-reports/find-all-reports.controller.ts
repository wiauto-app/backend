import { Controller, Get, Query, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { ReportsService } from "@/src/contexts/reports/services/reports.service";

import { V1_REPORTS } from "../../route.constants";
import { FindAllReportsHttpDto } from "./find-all-reports.http-dto";

@Controller(V1_REPORTS)
@UseGuards(JwtGuard)
export class FindAllReportsController {
  constructor(private readonly reports_service: ReportsService) {}

  @Get()
  run(
    @GetUserId() reporter_profile_id: string,
    @Query() query: FindAllReportsHttpDto,
  ) {
    return this.reports_service.findAll({
      reporter_profile_id,
      ...query,
    });
  }
}
