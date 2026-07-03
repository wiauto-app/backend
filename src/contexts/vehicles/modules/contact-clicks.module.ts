import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "@/src/contexts/auth/auth.module";

import { RecordVehicleContactClickUseCase } from "../application/contact-click-use-cases/record-vehicle-contact-click.use-case";
import { ContactClickRepository } from "../domain/repositories/contact-click.repository";
import { RecordVehicleContactClickController } from "../infrastructure/http-api/v1/contact-clicks/record-vehicle-contact-click.controller";
import { ContactClickEntity } from "../infrastructure/persistence/contact-click.entity";
import { VehicleEntity } from "../infrastructure/persistence/vehicle.entity";
import { TypeOrmContactClickRepository } from "../infrastructure/repositories/typeorm.contact-click-repository";
import { VehiclesModule } from "../vehicles.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([ContactClickEntity, VehicleEntity]),
    VehiclesModule,
    AuthModule,
  ],
  controllers: [RecordVehicleContactClickController],
  providers: [
    RecordVehicleContactClickUseCase,
    TypeOrmContactClickRepository,
    {
      provide: ContactClickRepository,
      useExisting: TypeOrmContactClickRepository,
    },
  ],
  exports: [ContactClickRepository, RecordVehicleContactClickUseCase],
})
export class ContactClicksModule {}
