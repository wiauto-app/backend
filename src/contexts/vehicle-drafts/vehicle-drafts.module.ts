import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { MeVehicleDraftController } from "./api/v1/me-vehicle-draft/me-vehicle-draft.controller";
import { VehicleDraftEntity } from "./entities/vehicle-draft.entity";
import { VehicleDraftService } from "./services/vehicle-draft.service";

@Module({
  imports: [TypeOrmModule.forFeature([VehicleDraftEntity])],
  controllers: [MeVehicleDraftController],
  providers: [VehicleDraftService],
  exports: [VehicleDraftService],
})
export class VehicleDraftsModule {}
