import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { VehicleTypeEntity } from "../infrastructure/persistence/vehicle-type.entity";
import { TypeormVehicleTypeRepository } from "../infrastructure/repositories/typeorm.vehicle-type-repository";
import { VehicleTypesRepository } from "../domain/repositories/vehicle-types.repository";
import { VehicleTypesController } from "../infrastructure/http-api/vehice-types-v1/vehicle-types.controller";
import { VehicleTypesUseCase } from "../application/vehicle-types-use-cases/vehicle-types.use-case";

@Module({
  controllers: [VehicleTypesController],
  imports: [TypeOrmModule.forFeature([VehicleTypeEntity])],
  providers: [
    VehicleTypesUseCase,
    TypeormVehicleTypeRepository,
    {
      provide: VehicleTypesRepository,
      useExisting: TypeormVehicleTypeRepository,
    }
  ],
  exports: [VehicleTypesRepository],
})
export class VehicleTypesModule { }