import { Module } from "@nestjs/common";
import { CreateVehicleController } from "./infrastructure/http-api/v1/create-vehicle/create-vehicle.controller";
import { CreateVehicleUseCase } from "./application/create-vehicle-use-case/create-vehicle.use-case";
import { VehicleRepository } from "./domain/vehicle.repository";
import { VehicleEntity } from "./infrastructure/persistence/vehicle.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TypeOrmVehicleRepository } from "./infrastructure/repositories/typeorm.vehicle-repository";
import { FindVehicleController } from "./infrastructure/http-api/v1/find-vehicle/find-vehicle.controller";
import { GetVehicleUseCase } from "./application/get-vehicle-use-case/get-vehicle.use-case";

@Module({
  controllers:[CreateVehicleController, FindVehicleController],
  providers:[

    /* Use Cases */
    CreateVehicleUseCase,
    GetVehicleUseCase,

    /* Repositories */
    TypeOrmVehicleRepository,

    /* Domain */
    {
      provide: VehicleRepository,
      useExisting: TypeOrmVehicleRepository
    }
  ],
  imports:[TypeOrmModule.forFeature([VehicleEntity])],
  exports:[CreateVehicleUseCase],
})
export class VehiclesModule{}