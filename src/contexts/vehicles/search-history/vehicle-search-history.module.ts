import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Comunity } from "@/src/contexts/locations/comunities/entities/comunity.entity";
import { Municipality } from "@/src/contexts/locations/municipalities/entities/municipality.entity";
import { Provinces } from "@/src/contexts/locations/provinces/entities/province.entity";
import { User } from "@/src/contexts/users/entities/user.entity";

import { CatalogFuelTypeEntity } from "../catalog/fuel_types/entities/catalog-fuel-type.entity";
import { MakeEntity } from "../catalog/makes/entities/make.entity";
import { CatalogModelEntity } from "../catalog/models/entities/catalog-model.entity";
import { CategoryEntity } from "../entities/category.entity";
import { VehicleTypeEntity } from "../entities/vehicle-type.entity";
import { VehicleSearchHistoryEntity } from "./entities/vehicle-search-history.entity";
import { VehicleSearchHistoryService } from "./services/vehicle-search-history.service";

/**
 * Persistencia del historial de búsquedas.
 *
 * Los controllers (`api/v1/*`) se registran en `VehiclesModule` y no aquí:
 * Nest registra las rutas del módulo padre antes que las de sus imports, así que
 * `GET|DELETE /v1/vehicles/search-history` quedaría capturado por
 * `GET|DELETE /v1/vehicles/:id`.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      VehicleSearchHistoryEntity,
      User,
      VehicleTypeEntity,
      MakeEntity,
      CatalogModelEntity,
      CategoryEntity,
      CatalogFuelTypeEntity,
      Provinces,
      Comunity,
      Municipality,
    ]),
  ],
  providers: [VehicleSearchHistoryService],
  exports: [VehicleSearchHistoryService],
})
export class VehicleSearchHistoryModule {}
