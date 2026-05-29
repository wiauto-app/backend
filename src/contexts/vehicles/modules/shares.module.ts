import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { RecordVehicleShareUseCase } from "../application/share-use-cases/record-vehicle-share-use-case/record-vehicle-share.use-case";
import { ShareRepository } from "../domain/repositories/share.repository";
import { RecordVehicleShareController } from "../infrastructure/http-api/v1/record-vehicle-share/record-vehicle-share.controller";
import { ShareEntity } from "../infrastructure/persistence/share.entity";
import { TypeOrmShareRepository } from "../infrastructure/repositories/typeorm.share-repository";
import { VehiclesModule } from "../vehicles.module";

@Module({
  imports: [TypeOrmModule.forFeature([ShareEntity]), VehiclesModule],
  controllers: [RecordVehicleShareController],
  providers: [
    RecordVehicleShareUseCase,
    TypeOrmShareRepository,
    {
      provide: ShareRepository,
      useExisting: TypeOrmShareRepository,
    },
  ],
  exports: [ShareRepository, RecordVehicleShareUseCase],
})
export class SharesModule {}
