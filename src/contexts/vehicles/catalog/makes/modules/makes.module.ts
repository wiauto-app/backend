import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { VehicleEntity } from "@/src/contexts/vehicles/entities/vehicle.entity";
import { MakeEntity } from "../entities/make.entity";
import { TypeormMakeRepository } from "../repositories/typeorm.make-repository";
import { MakesController } from "../api/makes-v1/makes.controller";
import { MakesService } from "../services/makes.service";

@Module({
  controllers: [MakesController],
  imports: [TypeOrmModule.forFeature([MakeEntity, VehicleEntity])],
  providers: [MakesService, TypeormMakeRepository],
  exports: [MakesService],
})
export class MakesModule {}
