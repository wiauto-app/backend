import { Controller, Get, Query, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { FindAllReportsUseCase } from "@/src/contexts/reports/application/report-use-cases/find-all-reports-use-case/find-all-reports.use-case";

import { V1_REPORTS } from "../../../route.constants";
import { FindAllReportsHttpDto } from "./find-all-reports.http-dto";

@Controller(V1_REPORTS)
@UseGuards(JwtGuard)
export class FindAllReportsController {
  constructor(private readonly find_all_reports_use_case: FindAllReportsUseCase) {}

  @Get()
  run(
    @GetUserId() reporter_profile_id: string,
    @Query() query: FindAllReportsHttpDto,
  ) {
    return this.find_all_reports_use_case.execute({
      reporter_profile_id,
      ...query,
    });
  }
}
