import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { VersionEntity } from "../../versions/entities/version.entity";
import { CatalogYearEntity } from "../entities/catalog-year.entity";
import { TypeormCatalogYearRepository } from "../repositories/typeorm.catalog-year-repository";
import { CatalogYearsController } from "../api/catalog-years-v1/catalog-years.controller";
import { CatalogYearsService } from "../services/catalog-years.service";

@Module({
  controllers: [CatalogYearsController],
  imports: [TypeOrmModule.forFeature([CatalogYearEntity, VersionEntity])],
  providers: [CatalogYearsService, TypeormCatalogYearRepository],
  exports: [CatalogYearsService],
})
export class CatalogYearsModule {}
