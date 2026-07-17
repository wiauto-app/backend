import { Body, Controller, Post, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { AdminOnlyGuard } from "@/src/contexts/roles/guards/admin-only.guard";
import { ReportsService } from "@/src/contexts/reports/services/reports.service";

import { V1_ADMIN_REPORTS } from "../../route.constants";
import { AdminCreateReportHttpDto } from "./admin-create-report.http-dto";

@Controller(V1_ADMIN_REPORTS)
@UseGuards(JwtGuard, AdminOnlyGuard)
export class AdminCreateReportController {
  constructor(private readonly reports_service: ReportsService) {}

  @Post()
  run(
    @GetUserId() auth_profile_id: string,
    @Body() body: AdminCreateReportHttpDto,
  ) {
    return this.reports_service.create({
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
