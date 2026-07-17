import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { VehicleEntity } from "@/src/contexts/vehicles/entities/vehicle.entity";
import { CatalogModelEntity } from "../entities/catalog-model.entity";
import { TypeormCatalogModelRepository } from "../repositories/typeorm.catalog-model-repository";
import { CatalogModelsController } from "../api/catalog-models-v1/catalog-models.controller";
import { CatalogModelsService } from "../services/catalog-models.service";

@Module({
  controllers: [CatalogModelsController],
  imports: [TypeOrmModule.forFeature([CatalogModelEntity, VehicleEntity])],
  providers: [CatalogModelsService, TypeormCatalogModelRepository],
  exports: [CatalogModelsService],
})
export class CatalogModelsModule {}
