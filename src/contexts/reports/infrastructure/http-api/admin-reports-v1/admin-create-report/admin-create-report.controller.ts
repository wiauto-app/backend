import { Body, Controller, Post, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { CreateReportUseCase } from "@/src/contexts/reports/application/report-use-cases/create-report-use-case/create-report.use-case";

import { V1_ADMIN_REPORTS } from "../../../route.constants";
import { AdminCreateReportHttpDto } from "./admin-create-report.http-dto";

@Controller(V1_ADMIN_REPORTS)
@UseGuards(JwtGuard)
export class AdminCreateReportController {
  constructor(private readonly create_report_use_case: CreateReportUseCase) {}

  @Post()
  run(
    @GetUserId() auth_profile_id: string,
    @Body() body: AdminCreateReportHttpDto,
  ) {
    return this.create_report_use_case.execute({
      reporter_profile_id: body.reporter_profile_id ?? auth_profile_id,
      category_id: body.category_id,
      title: body.title,
      description: body.description,
      file_url: body.file_url,
      target_type: body.target_type,
      target_id: body.target_id,
    });
  }
}
