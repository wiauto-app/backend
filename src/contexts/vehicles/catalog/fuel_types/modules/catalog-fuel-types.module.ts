import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CatalogFuelTypeEntity } from "../infrastructure/persistence/catalog-fuel-type.entity";
import { TypeormCatalogFuelTypeRepository } from "../infrastructure/repositories/typeorm.catalog-fuel-type-repository";
import { CatalogFuelTypesRepository } from "../domain/repositories/catalog-fuel-types.repository";
import { CatalogFuelTypesController } from "../infrastructure/http-api/catalog-fuel-types-v1/catalog-fuel-types.controller";
import { CatalogFuelTypesUseCase } from "../application/catalog-fuel-types-use-cases/catalog-fuel-types.use-case";

@Module({
  controllers: [CatalogFuelTypesController],
  imports: [TypeOrmModule.forFeature([CatalogFuelTypeEntity])],
  providers: [
    CatalogFuelTypesUseCase,
    TypeormCatalogFuelTypeRepository,
    {
      provide: CatalogFuelTypesRepository,
      useExisting: TypeormCatalogFuelTypeRepository,
    },
  ],
  exports: [CatalogFuelTypesRepository, CatalogFuelTypesUseCase],
})
export class CatalogFuelTypesModule {}
