import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { RecordVehicleImpressionsController } from "../api/v1/record-vehicle-impressions/record-vehicle-impressions.controller";
import { ImpressionEntity } from "../entities/impression.entity";
import { VehicleEntity } from "../entities/vehicle.entity";
import { TypeOrmImpressionRepository } from "../repositories/typeorm.impression-repository";
import { ImpressionsService } from "../services/impressions.service";
import { VehiclesModule } from "../vehicles.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([ImpressionEntity, VehicleEntity]),
    VehiclesModule,
  ],
  controllers: [RecordVehicleImpressionsController],
  providers: [ImpressionsService, TypeOrmImpressionRepository],
  exports: [ImpressionsService, TypeOrmImpressionRepository],
})
export class ImpressionsModule {}
