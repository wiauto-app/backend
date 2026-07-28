import { Module } from "@nestjs/common";

import { GetAdminDashboardController } from "./api/v1/get-admin-dashboard/get-admin-dashboard.controller";
import { TypeOrmAdminDashboardRepository } from "./repositories/typeorm.admin-dashboard-repository";
import { AdminDashboardService } from "./services/admin-dashboard.service";

@Module({
  controllers: [GetAdminDashboardController],
  providers: [AdminDashboardService, TypeOrmAdminDashboardRepository],
})
export class AdminDashboardModule {}
