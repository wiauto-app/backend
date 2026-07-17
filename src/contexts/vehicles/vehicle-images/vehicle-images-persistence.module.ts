import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { FileModule } from "@/shared/file/file.module";
import { VehicleImagesEntity } from "./entities/vehicle-images.entity";
import { TypeOrmVehicleImagesRepository } from "./repositories/typeorm.vehicle-images.repository";

@Module({
  imports: [
    TypeOrmModule.forFeature([VehicleImagesEntity]),
    forwardRef(() => FileModule),
  ],
  providers: [TypeOrmVehicleImagesRepository],
  exports: [TypeOrmVehicleImagesRepository],
})
export class VehicleImagesPersistenceModule {}
