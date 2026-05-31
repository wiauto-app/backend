import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CreateReportCategoryUseCase } from "../application/report-category-use-cases/create-report-category-use-case/create-report-category.use-case";
import { DeleteReportCategoryUseCase } from "../application/report-category-use-cases/delete-report-category-use-case/delete-report-category.use-case";
import { FindAllReportCategoriesUseCase } from "../application/report-category-use-cases/find-all-report-categories-use-case/find-all-report-categories.use-case";
import { FindReportCategoryUseCase } from "../application/report-category-use-cases/find-report-category-use-case/find-report-category.use-case";
import { UpdateReportCategoryUseCase } from "../application/report-category-use-cases/update-report-category-use-case/update-report-category.use-case";
import { ReportCategoryRepository } from "../domain/repositories/report-category.repository";
import { AdminCreateReportCategoryController } from "../infrastructure/http-api/admin-report-categories-v1/create-report-category/create-report-category.controller";
import { AdminDeleteReportCategoryController } from "../infrastructure/http-api/admin-report-categories-v1/delete-report-category/delete-report-category.controller";
import { AdminFindAllReportCategoriesController } from "../infrastructure/http-api/admin-report-categories-v1/find-all-report-categories/find-all-report-categories.controller";
import { AdminFindReportCategoryController } from "../infrastructure/http-api/admin-report-categories-v1/find-report-category/find-report-category.controller";
import { AdminUpdateReportCategoryController } from "../infrastructure/http-api/admin-report-categories-v1/update-report-category/update-report-category.controller";
import { FindAllReportCategoriesController } from "../infrastructure/http-api/report-categories-v1/find-all-report-categories/find-all-report-categories.controller";
import { ReportCategoryEntity } from "../infrastructure/persistence/report-category.entity";
import { TypeOrmReportCategoryRepository } from "../infrastructure/repositories/typeorm.report-category-repository";

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
  providers: [
    CreateReportCategoryUseCase,
    UpdateReportCategoryUseCase,
    FindReportCategoryUseCase,
    FindAllReportCategoriesUseCase,
    DeleteReportCategoryUseCase,
    TypeOrmReportCategoryRepository,
    {
      provide: ReportCategoryRepository,
      useExisting: TypeOrmReportCategoryRepository,
    },
  ],
  exports: [ReportCategoryRepository],
})
export class ReportCategoriesModule {}
