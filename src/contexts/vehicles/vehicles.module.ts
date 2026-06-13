import { Roles } from "@/src/contexts/roles/entities/roles.entity";
import { AuthModule } from "@/src/contexts/auth/auth.module";
import { PermissionModule } from "@/src/contexts/users/permissions/permission.module";
import { ProfileModule } from "@/src/contexts/profiles/profile.module";
import { AlertsModule } from "@/src/contexts/alerts/alerts.module";
import { VehicleCreationGuard } from "./infrastructure/guards/vehicleCreation.guard";
import { Module, forwardRef } from "@nestjs/common";
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
import { CategoryEntity } from "./infrastructure/persistence/category.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TypeOrmVehicleRepository } from "./infrastructure/repositories/typeorm.vehicle-repository";
import { FindVehicleController } from "./infrastructure/http-api/v1/find-vehicle/find-vehicle.controller";
import { GetVehicleUseCase } from "./application/vehicle/get-vehicle-use-case/get-vehicle.use-case";
import { FindSimilarVehiclesUseCase } from "./application/vehicle/find-similar-vehicles-use-case/find-similar-vehicles.use-case";
import { UpdateVehicleController } from "./infrastructure/http-api/v1/update-vehicle/update-vehicle.controller";

import { FileModule } from "../shared/file/file.module";
import { ImageValidationPipe } from "../shared/file/infrastructure/pipes/image-validation.pipe";
import { VehicleImagesModule } from "./vehicle-images/vehicle-images.module";
import { VehiclePricesModule } from "./vehicle-prices/vehicle-prices.module";
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
import { CategoriesModule } from "./modules/categories.module";
import { CatalogModule } from "./catalog/catalog.module";
import { UpdateVehicleUseCase } from "./application/vehicle/update-vehicle-use-case/update-vehicle.use-case";
import { FindAllVehiclesUseCase } from "./application/vehicle/find-all-vehicles-use-case/find-all-vehicles.use-case";
import { RemoveVehicleUseCase } from "./application/vehicle/remove-vehicle-use-case/remove-vehicle.use-case";
import { ValidateVehicleUseCase } from "./application/vehicle/validate-vehicle-use-case/validate-vehicle.use-case";
import { FindSimilarVehiclesController } from "./infrastructure/http-api/v1/find-similar-vehicles/find-similar-vehicles.controller";
import { RemoveVehicleController } from "./infrastructure/http-api/v1/remove-vehicle/remove-vehicle.controller";
import { AdminFindAllVehiclesUseCase } from "./application/admin-vehicles/admin-find-all-vehicles-use-case/admin-find-all-vehicles.use-case";
import { AdminFindAllVehiclesController } from "./infrastructure/http-api/admin-v1/admin-find-all-vehicles/admin-find-all-vehicles.controller";
import { AdminGetVehicleUseCase } from "./application/admin-vehicles/admin-get-vehicle-use-case/admin-get-vehicle.use-case";
import { AdminGetVehicleController } from "./infrastructure/http-api/admin-v1/admin-get-vehicle/admin-get-vehicle.controller";
import { AdminUpdateVehicleStatusUseCase } from "./application/admin-vehicles/admin-update-vehicle-status-use-case/admin-update-vehicle-status.use-case";
import { AdminUpdateVehicleStatusController } from "./infrastructure/http-api/admin-v1/admin-update-vehicle-status/admin-update-vehicle-status.controller";
import { PublishedVehicleSnapshotPort } from "./application/ports/published-vehicle-snapshot.port";
import { PublishedVehicleSnapshotService } from "./infrastructure/services/published-vehicle-snapshot.service";
import { ReverseGeocodingPort } from "./application/ports/reverse-geocoding.port";
import { GoogleReverseGeocodingService } from "./infrastructure/services/google-reverse-geocoding.service";
import { PostgisLocationResolver } from "./infrastructure/services/postgis-location.resolver";
import { ReverseGeocodingService } from "./infrastructure/services/reverse-geocoding.service";
import { VehicleSearchModule } from "./search/vehicle-search.module";
import { FindFiltersController } from "./infrastructure/http-api/filters-v1/find-filters.controller";
import { FindActiveFiltersController } from "./infrastructure/http-api/filters-v1/find-active-filters.controller";
import { FindFiltersUseCase } from "./application/filters/find-filters-use-case/find-filters.use-case";
import { FindActiveFiltersUseCase } from "./application/filters/find-active-filters-use-case/find-active-filters.use-case";
import { ActiveFiltersLookupPort } from "./application/ports/active-filters-lookup.port";
import { TypeOrmActiveFiltersLookupAdapter } from "./infrastructure/adapters/typeorm-active-filters-lookup.adapter";
import { MakeEntity } from "./catalog/makes/infrastructure/persistence/make.entity";
import { CatalogModelEntity } from "./catalog/models/infrastructure/persistence/catalog-model.entity";
import { CatalogFuelTypeEntity } from "./catalog/fuel_types/infrastructure/persistence/catalog-fuel-type.entity";
import { Provinces } from "@/src/contexts/locations/provinces/entities/province.entity";
import { Comunity } from "@/src/contexts/locations/comunities/entities/comunity.entity";
import { Municipality } from "@/src/contexts/locations/municipalities/entities/municipality.entity";
import { VehicleTypesUseCase } from "./application/vehicle-types-use-cases/vehicle-types.use-case";
import { ServicesUseCase } from "./application/services-use-cases/services.use-case";
import { CuotasUseCase } from "./application/cuotas-use-cases/cuotas.use-case";
import { TractionsUseCase } from "./application/tractions-use-cases/tractions.use-case";
import { WarrantyTypesUseCase } from "./application/warranty-types-use-cases/warranty-types.use-case";
import { ColorsUseCase } from "./application/colors-use-cases/colors.use-case";
import { DgtLabelsUseCase } from "./application/dgt-labels-use-cases/dgt-labels.use-case";
import { DealershipMembersEntity } from "../dealership/infrastructure/persistence/dealership-members.entity";

@Module({
  controllers: [CreateVehicleController, FindVehicleController, FindSimilarVehiclesController, UpdateVehicleController, RemoveVehicleController, CreateFeatureController, RemoveFeatureController, UpdateFeatureController, FindFeatureController, FindFeaturesController, FindAllVehiclesController, AdminFindAllVehiclesController, AdminGetVehicleController, AdminUpdateVehicleStatusController, FindFiltersController, FindActiveFiltersController],
  providers: [
    VehicleCreationGuard,
    ImageValidationPipe,
    /* Use Cases */
    CreateVehicleUseCase,
    GetVehicleUseCase,
    FindSimilarVehiclesUseCase,
    UpdateVehicleUseCase,
    FindAllVehiclesUseCase,
    RemoveVehicleUseCase,
    ValidateVehicleUseCase,
    CreateFeatureUseCase,
    RemoveFeatureUseCase,
    UpdateFeatureUseCase,
    FindFeatureUseCase,
    FindFeaturesUseCase,
    AdminFindAllVehiclesUseCase,
    AdminGetVehicleUseCase,
    AdminUpdateVehicleStatusUseCase,
    PublishedVehicleSnapshotService,
    GoogleReverseGeocodingService,
    PostgisLocationResolver,
    ReverseGeocodingService,
    FindFiltersUseCase,
    FindActiveFiltersUseCase,
    TypeOrmActiveFiltersLookupAdapter,
    VehicleTypesUseCase,
    ServicesUseCase,
    CuotasUseCase,
    TractionsUseCase,
    WarrantyTypesUseCase,
    ColorsUseCase,
    DgtLabelsUseCase,
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
    {
      provide: ActiveFiltersLookupPort,
      useExisting: TypeOrmActiveFiltersLookupAdapter,
    },
    {
      provide: PublishedVehicleSnapshotPort,
      useExisting: PublishedVehicleSnapshotService,
    },
    {
      provide: ReverseGeocodingPort,
      useExisting: ReverseGeocodingService,
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
      CategoryEntity,
      MakeEntity,
      CatalogModelEntity,
      CatalogFuelTypeEntity,
      Provinces,
      Comunity,
      Municipality,
      Roles,
      DealershipMembersEntity,
    ]),
    VehicleImagesModule,
    VehiclePricesModule,
    FileModule,
    VehicleTypesModule,
    ColorsModule,
    ServicesModule,
    DgtLabelsModule,
    WarrantyTypesModule,
    TractionsModule,
    CuotasModule,
    CategoriesModule,
    CatalogModule,
    AuthModule,
    PermissionModule,
    ProfileModule,
    forwardRef(() => AlertsModule),
    VehicleSearchModule,
      
  ],
  exports: [CreateVehicleUseCase, VehicleRepository, PublishedVehicleSnapshotPort],
})
export class VehiclesModule { }