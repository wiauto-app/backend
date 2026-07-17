import { Body, Controller, Post, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { ReportsService } from "@/src/contexts/reports/services/reports.service";

import { V1_REPORTS } from "../../route.constants";
import { CreateReportHttpDto } from "./create-report.http-dto";

@Controller(V1_REPORTS)
@UseGuards(JwtGuard)
export class CreateReportController {
  constructor(private readonly reports_service: ReportsService) {}

  @Post()
  run(@GetUserId() reporter_profile_id: string, @Body() body: CreateReportHttpDto) {
    return this.reports_service.create({
      reporter_profile_id,
      category_id: body.category_id,
      title: body.title,
      description: body.description,
      file_url: body.file_url,
      target_type: body.target_type,
      target_id: body.target_id,
    });
  }
}
