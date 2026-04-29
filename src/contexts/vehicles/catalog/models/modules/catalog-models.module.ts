import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CatalogModelEntity } from "../infrastructure/persistence/catalog-model.entity";
import { TypeormCatalogModelRepository } from "../infrastructure/repositories/typeorm.catalog-model-repository";
import { CatalogModelsRepository } from "../domain/repositories/catalog-models.repository";
import { CatalogModelsController } from "../infrastructure/http-api/catalog-models-v1/catalog-models.controller";
import { CatalogModelsUseCase } from "../application/catalog-models-use-cases/catalog-models.use-case";

@Module({
  controllers: [CatalogModelsController],
  imports: [TypeOrmModule.forFeature([CatalogModelEntity])],
  providers: [
    CatalogModelsUseCase,
    TypeormCatalogModelRepository,
    {
      provide: CatalogModelsRepository,
      useExisting: TypeormCatalogModelRepository,
    },
  ],
  exports: [CatalogModelsRepository],
})
export class CatalogModelsModule {}
