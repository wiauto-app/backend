import { Module } from "@nestjs/common";
import { CreateVehicleController } from "./infrastructure/http-api/v1/create-vehicle/create-vehicle.controller";
import { CreateVehicleUseCase } from "./application/create-vehicle-use-case/create-vehicle.use-case";
import { VehicleRepository } from "./domain/vehicle.repository";
import { VehicleEntity } from "./infrastructure/persistence/vehicle.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TypeOrmVehicleRepository } from "./infrastructure/repositories/typeorm.vehicle-repository";
import { FindVehicleController } from "./infrastructure/http-api/v1/find-vehicle/find-vehicle.controller";
import { GetVehicleUseCase } from "./application/get-vehicle-use-case/get-vehicle.use-case";
import { UpdateVehicleController } from "./infrastructure/http-api/v1/update-vehicle/update-vehicle.controller";
import { UpdateVehicleUseCase } from "./application/update-vehicle-use-case/update-vehicle.use-case";
import { FileModule } from "../shared/file/file.module";
import { ImageValidationPipe } from "../shared/file/infrastructure/pipes/image-validation.pipe";
import { VehicleImagesModule } from "./vehicle-images/vehicle-images.module";

@Module({
  controllers: [CreateVehicleController, FindVehicleController, UpdateVehicleController],
  providers: [
    ImageValidationPipe,
    /* Use Cases */
    CreateVehicleUseCase,
    GetVehicleUseCase,
    UpdateVehicleUseCase,

    /* Repositories */
    TypeOrmVehicleRepository,

    /* Domain */
    {
      provide: VehicleRepository,
      useExisting: TypeOrmVehicleRepository,
    },
  ],
  imports: [
    TypeOrmModule.forFeature([VehicleEntity]),
    VehicleImagesModule,
    FileModule,
  ],
  exports: [CreateVehicleUseCase],
})
export class VehiclesModule{}