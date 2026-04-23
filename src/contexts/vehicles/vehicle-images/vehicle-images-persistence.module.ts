import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { VehicleImageRepository } from "./domain/vehicle-imagen.repository";
import { VehicleImagesEntity } from "./infrastructure/persistence/vehicle-images.entity";
import { TypeOrmVehicleImagesRepository } from "./infrastructure/repositories/typeorm.vehicle-images.repository";

@Module({
  imports: [TypeOrmModule.forFeature([VehicleImagesEntity])],
  providers: [
    TypeOrmVehicleImagesRepository,
    {
      provide: VehicleImageRepository,
      useExisting: TypeOrmVehicleImagesRepository,
    },
  ],
  exports: [VehicleImageRepository],
})
export class VehicleImagesPersistenceModule {}
