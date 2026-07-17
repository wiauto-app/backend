import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { RecordVehicleShareController } from "../api/v1/record-vehicle-share/record-vehicle-share.controller";
import { ShareEntity } from "../entities/share.entity";
import { VehicleEntity } from "../entities/vehicle.entity";
import { TypeOrmShareRepository } from "../repositories/typeorm.share-repository";
import { SharesService } from "../services/shares.service";
import { VehiclesModule } from "../vehicles.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([ShareEntity, VehicleEntity]),
    VehiclesModule,
  ],
  controllers: [RecordVehicleShareController],
  providers: [SharesService, TypeOrmShareRepository],
  exports: [SharesService, TypeOrmShareRepository],
})
export class SharesModule {}
