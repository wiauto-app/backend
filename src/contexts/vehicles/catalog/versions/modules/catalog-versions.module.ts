import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { VersionEntity } from "../entities/version.entity";
import { VersionYearEntity } from "../entities/version-year.entity";
import { TypeormCatalogVersionRepository } from "../repositories/typeorm.catalog-version-repository";
import { CatalogVersionsController } from "../api/catalog-versions-v1/catalog-versions.controller";
import { CatalogVersionsService } from "../services/catalog-versions.service";

@Module({
  controllers: [CatalogVersionsController],
  imports: [TypeOrmModule.forFeature([VersionEntity, VersionYearEntity])],
  providers: [CatalogVersionsService, TypeormCatalogVersionRepository],
  exports: [CatalogVersionsService],
})
export class CatalogVersionsModule {}
