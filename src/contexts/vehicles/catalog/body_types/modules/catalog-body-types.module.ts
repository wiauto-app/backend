import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { VersionEntity } from "../../versions/entities/version.entity";
import { CatalogBodyTypeEntity } from "../entities/catalog-body-type.entity";
import { TypeormCatalogBodyTypeRepository } from "../repositories/typeorm.catalog-body-type-repository";
import { CatalogBodyTypesController } from "../api/catalog-body-types-v1/catalog-body-types.controller";
import { CatalogBodyTypesService } from "../services/catalog-body-types.service";

@Module({
  controllers: [CatalogBodyTypesController],
  imports: [TypeOrmModule.forFeature([CatalogBodyTypeEntity, VersionEntity])],
  providers: [CatalogBodyTypesService, TypeormCatalogBodyTypeRepository],
  exports: [CatalogBodyTypesService],
})
export class CatalogBodyTypesModule {}
