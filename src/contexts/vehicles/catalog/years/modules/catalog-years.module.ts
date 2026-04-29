import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CatalogYearEntity } from "../infrastructure/persistence/catalog-year.entity";
import { TypeormCatalogYearRepository } from "../infrastructure/repositories/typeorm.catalog-year-repository";
import { CatalogYearsRepository } from "../domain/repositories/catalog-years.repository";
import { CatalogYearsController } from "../infrastructure/http-api/catalog-years-v1/catalog-years.controller";
import { CatalogYearsUseCase } from "../application/catalog-years-use-cases/catalog-years.use-case";

@Module({
  controllers: [CatalogYearsController],
  imports: [TypeOrmModule.forFeature([CatalogYearEntity])],
  providers: [
    CatalogYearsUseCase,
    TypeormCatalogYearRepository,
    {
      provide: CatalogYearsRepository,
      useExisting: TypeormCatalogYearRepository,
    },
  ],
  exports: [CatalogYearsRepository],
})
export class CatalogYearsModule {}
