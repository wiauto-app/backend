import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { FileModule } from "../../shared/file/file.module";
import { VehicleTypeEntity } from "../entities/vehicle-type.entity";
import { VehicleTypesController } from "../api/vehice-types-v1/vehicle-types.controller";
import { VehicleTypesService } from "../services/vehicle-types.service";

@Module({
  controllers: [VehicleTypesController],
  imports: [TypeOrmModule.forFeature([VehicleTypeEntity]), FileModule],
  providers: [VehicleTypesService],
  exports: [VehicleTypesService],
})
export class VehicleTypesModule {}
