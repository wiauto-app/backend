import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { VersionEntity } from "../../versions/entities/version.entity";
import { CatalogFuelTypeEntity } from "../entities/catalog-fuel-type.entity";
import { TypeormCatalogFuelTypeRepository } from "../repositories/typeorm.catalog-fuel-type-repository";
import { CatalogFuelTypesController } from "../api/catalog-fuel-types-v1/catalog-fuel-types.controller";
import { CatalogFuelTypesService } from "../services/catalog-fuel-types.service";

@Module({
  controllers: [CatalogFuelTypesController],
  imports: [TypeOrmModule.forFeature([CatalogFuelTypeEntity, VersionEntity])],
  providers: [CatalogFuelTypesService, TypeormCatalogFuelTypeRepository],
  exports: [CatalogFuelTypesService],
})
export class CatalogFuelTypesModule {}
