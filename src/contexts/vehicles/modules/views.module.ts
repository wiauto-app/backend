import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { RecordVehicleViewUseCase } from "../application/view-use-cases/record-vehicle-view-use-case/record-vehicle-view.use-case";
import { ViewRepository } from "../domain/repositories/view.repository";
import { RecordVehicleViewController } from "../infrastructure/http-api/v1/record-vehicle-view/record-vehicle-view.controller";
import { VehicleEntity } from "../infrastructure/persistence/vehicle.entity";
import { ViewEntity } from "../infrastructure/persistence/view.entity";
import { TypeOrmViewRepository } from "../infrastructure/repositories/typeorm.view-repository";
import { VehiclesModule } from "../vehicles.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([ViewEntity, VehicleEntity]),
    VehiclesModule,
  ],
  controllers: [RecordVehicleViewController],
  providers: [
    RecordVehicleViewUseCase,
    TypeOrmViewRepository,
    {
      provide: ViewRepository,
      useExisting: TypeOrmViewRepository,
    },
  ],
  exports: [ViewRepository, RecordVehicleViewUseCase],
})
export class ViewsModule {}
