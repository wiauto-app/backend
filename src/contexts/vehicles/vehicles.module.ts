import { Roles } from "@/src/contexts/roles/entities/roles.entity";
import { AuthModule } from "@/src/contexts/auth/auth.module";
import { PermissionModule } from "@/src/contexts/users/permissions/permission.module";
import { ProfileModule } from "@/src/contexts/profiles/profile.module";
import { AlertsModule } from "@/src/contexts/alerts/alerts.module";
import { VehicleCreationGuard } from "./guards/vehicleCreation.guard";
import { VehicleOwnerGuard } from "./guards/vehicle-owner.guard";
import { Module, forwardRef } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { CreateVehicleController } from "./api/v1/create-vehicle/create-vehicle.controller";
import { VehicleEntity } from "./entities/vehicle.entity";
import { VehicleTypeEntity } from "./entities/vehicle-type.entity";
import { ColorEntity } from "./entities/color.entity";
import { ServiceEntity } from "./entities/service.entity";
import { DgtLabelEntity } from "./entities/dgt-label.entity";
import { WarrantyTypeEntity } from "./entities/warranty-type.entity";
import { TractionEntity } from "./entities/traction.entity";
import { CuotaEntity } from "./entities/cuota.entity";
import { CategoryEntity } from "./entities/category.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TypeOrmVehicleRepository } from "./repositories/typeorm.vehicle-repository";
import { FindVehicleController } from "./api/v1/find-vehicle/find-vehicle.controller";
import { UpdateVehicleController } from "./api/v1/update-vehicle/update-vehicle.controller";

import { FileModule } from "../shared/file/file.module";
import { ImageValidationPipe } from "../shared/file/pipes/image-validation.pipe";
import { VehicleImagesModule } from "./vehicle-images/vehicle-images.module";
import { VehiclePricesModule } from "./vehicle-prices/vehicle-prices.module";
import { FeaturesEntity } from "./entities/features.entity";
import { FindAllVehiclesController } from "./api/v1/find-all-vehicles/find-all-vehicles.controller";
import { VehicleTypesModule } from "./modules/vehicle-types.module";
import { ColorsModule } from "./modules/colors.module";
import { ServicesModule } from "./modules/services.module";
import { DgtLabelsModule } from "./modules/dgt-labels.module";
import { WarrantyTypesModule } from "./modules/warranty-types.module";
import { TractionsModule } from "./modules/tractions.module";
import { CuotasModule } from "./modules/cuotas.module";
import { CategoriesModule } from "./modules/categories.module";
import { FeaturesModule } from "./modules/features.module";
import { CatalogModule } from "./catalog/catalog.module";
import { FindSimilarVehiclesController } from "./api/v1/find-similar-vehicles/find-similar-vehicles.controller";
import { RemoveVehicleController } from "./api/v1/remove-vehicle/remove-vehicle.controller";
import { FindOwnerVehiclesController } from "./api/v1/find-owner-vehicles/find-owner-vehicles.controller";
import { DuplicateVehicleController } from "./api/v1/duplicate-vehicle/duplicate-vehicle.controller";
import { RenewVehicleController } from "./api/v1/renew-vehicle/renew-vehicle.controller";
import { ScheduleVehicleController } from "./api/v1/schedule-vehicle/schedule-vehicle.controller";
import { UpdateOwnerVehicleStatusController } from "./api/v1/update-owner-vehicle-status/update-owner-vehicle-status.controller";
import { TypeOrmVehicleAnalyticsRepository } from "./repositories/typeorm.vehicle-analytics-repository";
import { SCHEDULED_VEHICLE_PUBLISH_QUEUE } from "./queues/scheduled-vehicle-publish.queue.constants";
import { ScheduledVehiclePublishProcessor } from "./queues/scheduled-vehicle-publish.processor";
import { ScheduledVehiclePublishBootstrapService } from "./queues/scheduled-vehicle-publish-bootstrap.service";
import { FEATURED_VEHICLE_EXPIRY_QUEUE } from "./queues/featured-vehicle-expiry.queue.constants";
import { FeaturedVehicleExpiryProcessor } from "./queues/featured-vehicle-expiry.processor";
import { FeaturedVehicleExpiryBootstrapService } from "./queues/featured-vehicle-expiry-bootstrap.service";
import { VehiclePriceEntity } from "./vehicle-prices/entities/vehicle-price.entity";
import { get_vehicle_images_entity } from "./entities/vehicle-images-entity.relation-type";
import { AdminFindAllVehiclesController } from "./api/admin-v1/admin-find-all-vehicles/admin-find-all-vehicles.controller";
import { AdminGetVehicleController } from "./api/admin-v1/admin-get-vehicle/admin-get-vehicle.controller";
import { AdminUpdateVehicleStatusController } from "./api/admin-v1/admin-update-vehicle-status/admin-update-vehicle-status.controller";
import { PublishedVehicleSnapshotPort } from "./ports/published-vehicle-snapshot.port";
import { PublishedVehicleSnapshotService } from "./services/published-vehicle-snapshot.service";
import { ReverseGeocodingPort } from "./ports/reverse-geocoding.port";
import { GoogleReverseGeocodingService } from "./services/google-reverse-geocoding.service";
import { PostgisLocationResolver } from "./services/postgis-location.resolver";
import { ReverseGeocodingService } from "./services/reverse-geocoding.service";
import { VehicleSearchModule } from "./search/vehicle-search.module";
import { FindFiltersController } from "./api/filters-v1/find-filters.controller";
import { FindActiveFiltersController } from "./api/filters-v1/find-active-filters.controller";
import { ActiveFiltersLookupPort } from "./ports/active-filters-lookup.port";
import { TypeOrmActiveFiltersLookupAdapter } from "./clients/typeorm-active-filters-lookup.adapter";
import { MakeEntity } from "./catalog/makes/entities/make.entity";
import { CatalogModelEntity } from "./catalog/models/entities/catalog-model.entity";
import { CatalogFuelTypeEntity } from "./catalog/fuel_types/entities/catalog-fuel-type.entity";
import { CatalogYearEntity } from "./catalog/years/entities/catalog-year.entity";
import { VersionEntity } from "./catalog/versions/entities/version.entity";
import { LocationsModule } from "@/src/contexts/locations/locations.module";
import { DealershipMembersEntity } from "../dealership/entities/dealership-members.entity";
import { DealershipModule } from "../dealership/dealership.module";
import { DealershipInvitationModule } from "../dealership/modules/dealership-invitation.module";
import { ChatModule } from "../chat/modules/chat.module";
import { GetOwnerDashboardController } from "./api/v1/get-owner-dashboard/get-owner-dashboard.controller";
import { TypeOrmOwnerDashboardRepository } from "./repositories/typeorm.owner-dashboard-repository";
import { RecommendVehiclePriceController } from "./api/v1/vehicle-ai/recommend-vehicle-price.controller";
import { GenerateVehicleDescriptionController } from "./api/v1/vehicle-ai/generate-vehicle-description.controller";
import { RecommendVehiclePriceService } from "./services/recommend-vehicle-price.service";
import { GenerateVehicleDescriptionService } from "./services/generate-vehicle-description.service";
import { VehicleMarketStatsService } from "./services/vehicle-market-stats.service";
import { VehicleAiPromptService } from "./services/vehicle-ai-prompt.service";
import { VehicleAiContextResolverService } from "./services/vehicle-ai-context-resolver.service";
import { VehicleIdentificationController } from "./api/vehicle-identification.controller";
import { VehicleIdentificationService } from "./services/vehicle-identification.service";
import { CatalogReverseMatchService } from "./services/catalog-reverse-match.service";
import { CatalogIdentityLookupService } from "./services/catalog-identity-lookup.service";
import { ApiVehiculoClient } from "./clients/apivehiculo.client";
import { VehicleService } from "./services/vehicle.service";
import { VehicleFiltersService } from "./services/vehicle-filters.service";
import { OwnerDashboardService } from "./services/owner-dashboard.service";

@Module({
  controllers: [
    CreateVehicleController,
    FindOwnerVehiclesController,
    GetOwnerDashboardController,
    FindVehicleController,
    FindSimilarVehiclesController,
    UpdateVehicleController,
    RemoveVehicleController,
    DuplicateVehicleController,
    RenewVehicleController,
    ScheduleVehicleController,
    UpdateOwnerVehicleStatusController,
    RecommendVehiclePriceController,
    GenerateVehicleDescriptionController,
    VehicleIdentificationController,
    FindAllVehiclesController,
    AdminFindAllVehiclesController,
    AdminGetVehicleController,
    AdminUpdateVehicleStatusController,
    FindFiltersController,
    FindActiveFiltersController],
  providers: [
    VehicleCreationGuard,
    VehicleOwnerGuard,
    ImageValidationPipe,
    VehicleService,
    VehicleFiltersService,
    OwnerDashboardService,
    ScheduledVehiclePublishProcessor,
    ScheduledVehiclePublishBootstrapService,
    FeaturedVehicleExpiryProcessor,
    FeaturedVehicleExpiryBootstrapService,
    PublishedVehicleSnapshotService,
    GoogleReverseGeocodingService,
    PostgisLocationResolver,
    ReverseGeocodingService,
    TypeOrmActiveFiltersLookupAdapter,
    RecommendVehiclePriceService,
    GenerateVehicleDescriptionService,
    VehicleMarketStatsService,
    VehicleAiPromptService,
    VehicleAiContextResolverService,
    VehicleIdentificationService,
    CatalogReverseMatchService,
    CatalogIdentityLookupService,
    ApiVehiculoClient,
    TypeOrmVehicleRepository,
    TypeOrmVehicleAnalyticsRepository,
    TypeOrmOwnerDashboardRepository,
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
      CatalogYearEntity,
      VersionEntity,
      Roles,
      DealershipMembersEntity,
      VehiclePriceEntity,
      get_vehicle_images_entity()]),
    BullModule.registerQueue({ name: SCHEDULED_VEHICLE_PUBLISH_QUEUE }),
    BullModule.registerQueue({ name: FEATURED_VEHICLE_EXPIRY_QUEUE }),
    LocationsModule,
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
    FeaturesModule,
    CatalogModule,
    AuthModule,
    PermissionModule,
    ProfileModule,
    DealershipModule,
    DealershipInvitationModule,
    forwardRef(() => ChatModule),
    forwardRef(() => AlertsModule),
    VehicleSearchModule],
  exports: [
    VehicleService,
    TypeOrmVehicleRepository,
    TypeOrmVehicleRepository,
    PublishedVehicleSnapshotPort,
    VehicleTypesModule,
    ServicesModule,
    CuotasModule,
    TractionsModule,
    WarrantyTypesModule,
    ColorsModule,
    DgtLabelsModule,
    FeaturesModule,
    CategoriesModule,
    CatalogModule],
})
export class VehiclesModule {}
