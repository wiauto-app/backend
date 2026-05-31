import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { VehiclePriceRepository } from "./domain/vehicle-price.repository";
import { VehiclePriceEntity } from "./infrastructure/persistence/vehicle-price.entity";
import { TypeOrmVehiclePriceRepository } from "./infrastructure/repositories/typeorm.vehicle-price.repository";

@Module({
  imports: [TypeOrmModule.forFeature([VehiclePriceEntity])],
  providers: [
    TypeOrmVehiclePriceRepository,
    {
      provide: VehiclePriceRepository,
      useExisting: TypeOrmVehiclePriceRepository,
    },
  ],
  exports: [VehiclePriceRepository],
})
export class VehiclePricesPersistenceModule {}
