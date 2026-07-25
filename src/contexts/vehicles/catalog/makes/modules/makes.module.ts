import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { FileModule } from "@/src/contexts/shared/file/file.module";
import { VehicleEntity } from "@/src/contexts/vehicles/entities/vehicle.entity";
import { MakesController } from "../api/makes-v1/makes.controller";
import { WikimediaCommonsClient } from "../clients/wikimedia-commons.client";
import { MakeEntity } from "../entities/make.entity";
import { TypeormMakeRepository } from "../repositories/typeorm.make-repository";
import { MakesService } from "../services/makes.service";
import { SyncMakeLogosService } from "../services/sync-make-logos.service";

@Module({
  controllers: [MakesController],
  imports: [
    TypeOrmModule.forFeature([MakeEntity, VehicleEntity]),
    FileModule,
  ],
  providers: [
    MakesService,
    SyncMakeLogosService,
    TypeormMakeRepository,
    WikimediaCommonsClient,
  ],
  exports: [MakesService],
})
export class MakesModule {}
