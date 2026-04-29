import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { VersionEntity } from "../infrastructure/persistence/version.entity";
import { TypeormCatalogVersionRepository } from "../infrastructure/repositories/typeorm.catalog-version-repository";
import { CatalogVersionsRepository } from "../domain/repositories/catalog-versions.repository";
import { CatalogVersionsController } from "../infrastructure/http-api/catalog-versions-v1/catalog-versions.controller";
import { CatalogVersionsUseCase } from "../application/catalog-versions-use-cases/catalog-versions.use-case";

@Module({
  controllers: [CatalogVersionsController],
  imports: [TypeOrmModule.forFeature([VersionEntity])],
  providers: [
    CatalogVersionsUseCase,
    TypeormCatalogVersionRepository,
    {
      provide: CatalogVersionsRepository,
      useExisting: TypeormCatalogVersionRepository,
    },
  ],
  exports: [CatalogVersionsRepository],
})
export class CatalogVersionsModule {}
