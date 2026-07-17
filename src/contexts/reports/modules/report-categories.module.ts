import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AdminCreateReportCategoryController } from "../api/admin-report-categories-v1/create-report-category/create-report-category.controller";
import { AdminDeleteReportCategoryController } from "../api/admin-report-categories-v1/delete-report-category/delete-report-category.controller";
import { AdminFindAllReportCategoriesController } from "../api/admin-report-categories-v1/find-all-report-categories/find-all-report-categories.controller";
import { AdminFindReportCategoryController } from "../api/admin-report-categories-v1/find-report-category/find-report-category.controller";
import { AdminUpdateReportCategoryController } from "../api/admin-report-categories-v1/update-report-category/update-report-category.controller";
import { FindAllReportCategoriesController } from "../api/report-categories-v1/find-all-report-categories/find-all-report-categories.controller";
import { ReportCategoryEntity } from "../entities/report-category.entity";
import { ReportCategoriesService } from "../services/report-categories.service";

@Module({
  controllers: [
    AdminCreateReportCategoryController,
    AdminUpdateReportCategoryController,
    AdminFindReportCategoryController,
    AdminFindAllReportCategoriesController,
    AdminDeleteReportCategoryController,
    FindAllReportCategoriesController,
  ],
  imports: [TypeOrmModule.forFeature([ReportCategoryEntity])],
  providers: [ReportCategoriesService],
  exports: [ReportCategoriesService],
})
export class ReportCategoriesModule {}
