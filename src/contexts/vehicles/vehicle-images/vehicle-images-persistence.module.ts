import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { FileModule } from "@/shared/file/file.module";
import { VehicleImageRepository } from "./domain/vehicle-imagen.repository";
import { VehicleImagesEntity } from "./infrastructure/persistence/vehicle-images.entity";
import { TypeOrmVehicleImagesRepository } from "./infrastructure/repositories/typeorm.vehicle-images.repository";

@Module({
  imports: [
    TypeOrmModule.forFeature([VehicleImagesEntity]),
    forwardRef(() => FileModule),
  ],
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
