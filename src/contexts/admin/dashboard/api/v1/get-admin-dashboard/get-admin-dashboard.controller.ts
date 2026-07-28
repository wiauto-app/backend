import { Controller, Get, Query, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { AdminOnlyGuard } from "@/src/contexts/roles/guards/admin-only.guard";

import { AdminDashboardService } from "../../../services/admin-dashboard.service";
import { V1_ADMIN_DASHBOARD } from "../../route.constants";
import { GetAdminDashboardHttpDto } from "./get-admin-dashboard.http-dto";

@Controller()
@UseGuards(JwtGuard, AdminOnlyGuard)
export class GetAdminDashboardController {
  constructor(
    private readonly adminDashboardService: AdminDashboardService,
  ) {}

  @Get(V1_ADMIN_DASHBOARD)
  run(@Query() query: GetAdminDashboardHttpDto) {
    return this.adminDashboardService.getDashboard({
      startDate: query.startDate,
      endDate: query.endDate,
    });
  }
}
