import { Module } from "@nestjs/common";
import { VehicleCreatorController } from "./vehicle-creator.controller";
import { VehicleCreatorService } from "./vehicle-creator.service";


@Module({

  controllers: [VehicleCreatorController],
  providers: [VehicleCreatorService],
  exports: [VehicleCreatorService],
})
export class VehicleCreatorModule {}