import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "@/src/contexts/auth/auth.module";
import { DealershipModule } from "@/src/contexts/dealership/dealership.module";
import { ProfileModule } from "@/src/contexts/profiles/profile.module";
import { VehiclesModule } from "@/src/contexts/vehicles/vehicles.module";

import { AdminFindAllReportsUseCase } from "../application/report-use-cases/admin-find-all-reports-use-case/admin-find-all-reports.use-case";
import { AdminFindReportUseCase } from "../application/report-use-cases/admin-find-report-use-case/admin-find-report.use-case";
import { AdminUpdateReportUseCase } from "../application/report-use-cases/admin-update-report-use-case/admin-update-report.use-case";
import { CreateReportUseCase } from "../application/report-use-cases/create-report-use-case/create-report.use-case";
import { DeleteReportUseCase } from "../application/report-use-cases/delete-report-use-case/delete-report.use-case";
import { FindAllReportsUseCase } from "../application/report-use-cases/find-all-reports-use-case/find-all-reports.use-case";
import { FindReportUseCase } from "../application/report-use-cases/find-report-use-case/find-report.use-case";
import { ReportRepository } from "../domain/repositories/report.repository";
import { AdminCreateReportController } from "../infrastructure/http-api/admin-reports-v1/admin-create-report/admin-create-report.controller";
import { AdminDeleteReportController } from "../infrastructure/http-api/admin-reports-v1/delete-report/delete-report.controller";
import { AdminFindAllReportsController } from "../infrastructure/http-api/admin-reports-v1/admin-find-all-reports/admin-find-all-reports.controller";
import { AdminFindReportController } from "../infrastructure/http-api/admin-reports-v1/admin-find-report/admin-find-report.controller";
import { AdminUpdateReportController } from "../infrastructure/http-api/admin-reports-v1/admin-update-report/admin-update-report.controller";
import { CreateReportController } from "../infrastructure/http-api/reports-v1/create-report/create-report.controller";
import { FindAllReportsController } from "../infrastructure/http-api/reports-v1/find-all-reports/find-all-reports.controller";
import { FindReportController } from "../infrastructure/http-api/reports-v1/find-report/find-report.controller";
import { ReportEntity } from "../infrastructure/persistence/report.entity";
import { TypeOrmReportRepository } from "../infrastructure/repositories/typeorm.report-repository";
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
  providers: [
    CreateReportUseCase,
    FindAllReportsUseCase,
    FindReportUseCase,
    AdminFindAllReportsUseCase,
    AdminFindReportUseCase,
    AdminUpdateReportUseCase,
    DeleteReportUseCase,
    TypeOrmReportRepository,
    {
      provide: ReportRepository,
      useExisting: TypeOrmReportRepository,
    },
  ],
})
export class ReportsModule {}
