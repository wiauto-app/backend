import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CatalogBodyTypeEntity } from "../infrastructure/persistence/catalog-body-type.entity";
import { TypeormCatalogBodyTypeRepository } from "../infrastructure/repositories/typeorm.catalog-body-type-repository";
import { CatalogBodyTypesRepository } from "../domain/repositories/catalog-body-types.repository";
import { CatalogBodyTypesController } from "../infrastructure/http-api/catalog-body-types-v1/catalog-body-types.controller";
import { CatalogBodyTypesUseCase } from "../application/catalog-body-types-use-cases/catalog-body-types.use-case";

@Module({
  controllers: [CatalogBodyTypesController],
  imports: [TypeOrmModule.forFeature([CatalogBodyTypeEntity])],
  providers: [
    CatalogBodyTypesUseCase,
    TypeormCatalogBodyTypeRepository,
    {
      provide: CatalogBodyTypesRepository,
      useExisting: TypeormCatalogBodyTypeRepository,
    },
  ],
  exports: [CatalogBodyTypesRepository],
})
export class CatalogBodyTypesModule {}
