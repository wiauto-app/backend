import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { VehiclePriceEntity } from "./entities/vehicle-price.entity";
import { TypeOrmVehiclePriceRepository } from "./repositories/typeorm.vehicle-price.repository";

@Module({
  imports: [TypeOrmModule.forFeature([VehiclePriceEntity])],
  providers: [TypeOrmVehiclePriceRepository],
  exports: [TypeOrmVehiclePriceRepository],
})
export class VehiclePricesPersistenceModule {}
