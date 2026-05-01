import { Module } from "@nestjs/common";
import { CreateVehicleController } from "./infrastructure/http-api/v1/create-vehicle/create-vehicle.controller";
import { CreateVehicleUseCase } from "./application/vehicle/create-vehicle-use-case/create-vehicle.use-case";
import { VehicleRepository } from "./domain/repositories/vehicle.repository";
import { VehicleEntity } from "./infrastructure/persistence/vehicle.entity";
import { VehicleTypeEntity } from "./infrastructure/persistence/vehicle-type.entity";
import { ColorEntity } from "./infrastructure/persistence/color.entity";
import { ServiceEntity } from "./infrastructure/persistence/service.entity";
import { DgtLabelEntity } from "./infrastructure/persistence/dgt-label.entity";
import { WarrantyTypeEntity } from "./infrastructure/persistence/warranty-type.entity";
import { TractionEntity } from "./infrastructure/persistence/traction.entity";
import { CuotaEntity } from "./infrastructure/persistence/cuota.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TypeOrmVehicleRepository } from "./infrastructure/repositories/typeorm.vehicle-repository";
import { FindVehicleController } from "./infrastructure/http-api/v1/find-vehicle/find-vehicle.controller";
import { GetVehicleUseCase } from "./application/vehicle/get-vehicle-use-case/get-vehicle.use-case";
import { UpdateVehicleController } from "./infrastructure/http-api/v1/update-vehicle/update-vehicle.controller";

import { FileModule } from "../shared/file/file.module";
import { ImageValidationPipe } from "../shared/file/infrastructure/pipes/image-validation.pipe";
import { VehicleImagesModule } from "./vehicle-images/vehicle-images.module";
import { CreateFeatureController } from "./infrastructure/http-api/feature-v1/create-feature/create-feature.controller";
import { CreateFeatureUseCase } from "./application/features/create-feature-use-case/create-feature.use-case";
import { FeatureRepository } from "./domain/repositories/feature.repository";
import { TypeOrmFeatureRepository } from "./infrastructure/repositories/typeorm.feature-repository";
import { FeaturesEntity } from "./infrastructure/persistence/features.entity";
import { RemoveFeatureController } from "./infrastructure/http-api/feature-v1/remove-feature/remove-feature.controller";
import { RemoveFeatureUseCase } from "./application/features/remove-feature-use-case/remove-feature.use-case";
import { UpdateFeatureController } from "./infrastructure/http-api/feature-v1/update-feature/update-feature.controller";
import { UpdateFeatureUseCase } from "./application/features/update-feature-use-case/update-feature.use-case";
import { FindFeatureController } from "./infrastructure/http-api/feature-v1/find-feature/find-feature.controller";
import { FindFeaturesController } from "./infrastructure/http-api/feature-v1/find-features/find-features.controller";
import { FindFeatureUseCase } from "./application/features/find-feature-use-case/find-feature.use-case";
import { FindFeaturesUseCase } from "./application/features/find-features-use-case/find-features.use-case";
import { FindAllVehiclesController } from "./infrastructure/http-api/v1/find-all-vehicles/find-all-vehicles.controller";
import { VehicleTypesModule } from "./modules/vehicle-types.module";
import { ColorsModule } from "./modules/colors.module";
import { ServicesModule } from "./modules/services.module";
import { DgtLabelsModule } from "./modules/dgt-labels.module";
import { WarrantyTypesModule } from "./modules/warranty-types.module";
import { TractionsModule } from "./modules/tractions.module";
import { CuotasModule } from "./modules/cuotas.module";
import { CatalogModule } from "./catalog/catalog.module";
import { UpdateVehicleUseCase } from "./application/vehicle/update-vehicle-use-case/update-vehicle.use-case";
import { FindAllVehiclesUseCase } from "./application/vehicle/find-all-vehicles-use-case/find-all-vehicles.use-case";
import { RemoveVehicleUseCase } from "./application/vehicle/remove-vehicle-use-case/remove-vehicle.use-case";
import { ValidateVehicleUseCase } from "./application/vehicle/validate-vehicle-use-case/validate-vehicle.use-case";
import { RemoveVehicleController } from "./infrastructure/http-api/v1/remove-vehicle/remove-vehicle.controller";

@Module({
  controllers: [CreateVehicleController, FindVehicleController, UpdateVehicleController, RemoveVehicleController, CreateFeatureController, RemoveFeatureController, UpdateFeatureController, FindFeatureController, FindFeaturesController, FindAllVehiclesController],
  providers: [
    ImageValidationPipe,
    /* Use Cases */
    CreateVehicleUseCase,
    GetVehicleUseCase,
    UpdateVehicleUseCase,
    FindAllVehiclesUseCase,
    RemoveVehicleUseCase,
    ValidateVehicleUseCase,
    CreateFeatureUseCase,
    RemoveFeatureUseCase,
    UpdateFeatureUseCase,
    FindFeatureUseCase,
    FindFeaturesUseCase,
    /* Repositories */
    TypeOrmVehicleRepository,
    TypeOrmFeatureRepository,
    /* Domain */
    {
      provide: VehicleRepository,
      useExisting: TypeOrmVehicleRepository,
    },
    {
      provide: FeatureRepository,
      useExisting: TypeOrmFeatureRepository,
    },
  ],
  imports: [
    TypeOrmModule.forFeature([
      VehicleEntity,
      FeaturesEntity,
      VehicleTypeEntity,
      ColorEntity,
      ServiceEntity,
      DgtLabelEntity,
      WarrantyTypeEntity,
      TractionEntity,
      CuotaEntity,
    ]),
    VehicleImagesModule,
    FileModule,
    VehicleTypesModule,
    ColorsModule,
    ServicesModule,
    DgtLabelsModule,
    WarrantyTypesModule,
    TractionsModule,
    CuotasModule,
    CatalogModule,
  ],
  exports: [CreateVehicleUseCase],
})
export class VehiclesModule { }