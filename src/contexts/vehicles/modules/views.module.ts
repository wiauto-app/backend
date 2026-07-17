import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { RecordVehicleViewController } from "../api/v1/record-vehicle-view/record-vehicle-view.controller";
import { VehicleEntity } from "../entities/vehicle.entity";
import { ViewEntity } from "../entities/view.entity";
import { TypeOrmViewRepository } from "../repositories/typeorm.view-repository";
import { ViewsService } from "../services/views.service";
import { VehiclesModule } from "../vehicles.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([ViewEntity, VehicleEntity]),
    VehiclesModule,
  ],
  controllers: [RecordVehicleViewController],
  providers: [ViewsService, TypeOrmViewRepository],
  exports: [ViewsService, TypeOrmViewRepository],
})
export class ViewsModule {}
