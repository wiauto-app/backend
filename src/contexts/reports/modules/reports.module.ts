import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "@/src/contexts/auth/auth.module";
import { DealershipModule } from "@/src/contexts/dealership/dealership.module";
import { ProfileModule } from "@/src/contexts/profiles/profile.module";
import { VehiclesModule } from "@/src/contexts/vehicles/vehicles.module";

import { AdminCreateReportController } from "../api/admin-reports-v1/admin-create-report/admin-create-report.controller";
import { AdminDeleteReportController } from "../api/admin-reports-v1/delete-report/delete-report.controller";
import { AdminFindAllReportsController } from "../api/admin-reports-v1/admin-find-all-reports/admin-find-all-reports.controller";
import { AdminFindReportController } from "../api/admin-reports-v1/admin-find-report/admin-find-report.controller";
import { AdminUpdateReportController } from "../api/admin-reports-v1/admin-update-report/admin-update-report.controller";
import { CreateReportController } from "../api/reports-v1/create-report/create-report.controller";
import { FindAllReportsController } from "../api/reports-v1/find-all-reports/find-all-reports.controller";
import { FindReportController } from "../api/reports-v1/find-report/find-report.controller";
import { ReportEntity } from "../entities/report.entity";
import { TypeOrmReportRepository } from "../repositories/typeorm.report-repository";
import { ReportsService } from "../services/reports.service";
import { ReportCategoriesModule } from "./report-categories.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([ReportEntity]),
    ReportCategoriesModule,
    AuthModule,
    ProfileModule,
    DealershipModule,
    VehiclesModule,
  ],
  controllers: [
    CreateReportController,
    FindAllReportsController,
    FindReportController,
    AdminCreateReportController,
    AdminFindAllReportsController,
    AdminFindReportController,
    AdminUpdateReportController,
    AdminDeleteReportController,
  ],
  providers: [ReportsService, TypeOrmReportRepository],
  exports: [ReportsService],
})
export class ReportsModule {}
