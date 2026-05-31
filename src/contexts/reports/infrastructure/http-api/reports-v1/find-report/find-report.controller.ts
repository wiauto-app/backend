import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { FindReportUseCase } from "@/src/contexts/reports/application/report-use-cases/find-report-use-case/find-report.use-case";

import { V1_REPORTS } from "../../../route.constants";

@Controller(V1_REPORTS)
@UseGuards(JwtGuard)
export class FindReportController {
  constructor(private readonly find_report_use_case: FindReportUseCase) {}

  @Get(":id")
  run(
    @GetUserId() reporter_profile_id: string,
    @Param("id", ParseUUIDPipe) report_id: string,
  ) {
    return this.find_report_use_case.execute({
      report_id,
      reporter_profile_id,
    });
  }
}
