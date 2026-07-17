import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "@/src/contexts/auth/auth.module";

import { RecordVehicleContactClickController } from "../api/v1/contact-clicks/record-vehicle-contact-click.controller";
import { ContactClickEntity } from "../entities/contact-click.entity";
import { VehicleEntity } from "../entities/vehicle.entity";
import { TypeOrmContactClickRepository } from "../repositories/typeorm.contact-click-repository";
import { ContactClicksService } from "../services/contact-clicks.service";
import { VehiclesModule } from "../vehicles.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([ContactClickEntity, VehicleEntity]),
    VehiclesModule,
    AuthModule,
  ],
  controllers: [RecordVehicleContactClickController],
  providers: [ContactClicksService, TypeOrmContactClickRepository],
  exports: [ContactClicksService, TypeOrmContactClickRepository],
})
export class ContactClicksModule {}
