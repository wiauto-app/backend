import { OutboundMailEnqueueService } from "@/src/contexts/shared/mail/outbound-mail-enqueue.service";
import { TypeOrmProfileUserRepository } from "@/src/contexts/profiles/repositories/typeorm.profile-user-repository";
import { PromoteTempStoragePathsService } from "@/src/contexts/shared/file/services/promote-temp-storage-paths.service";
import { DealershipMembersEntity } from "@/src/contexts/dealership/entities/dealership-members.entity";
import { Injectable, Logger } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, EntityManager, EntityTarget, In } from "typeorm";

import { CatalogFuelTypeNotFoundException } from "../../../catalog/fuel_types/exceptions/catalog-fuel-type-not-found.exception";
import { FuelIncompatibilitiesException } from "../../../catalog/fuel_types/exceptions/fuel_incompatibilities.exception";
import { CatalogFuelTypesService } from "../../../catalog/fuel_types/services/catalog-fuel-types.service";
import { CatalogVersionsService } from "../../../catalog/versions/services/catalog-versions.service";
import { ElectricDisplacementException } from "../../../exceptions/electric-displacement.exception";
import { InvalidateVehicleVersionIdException } from "../../../exceptions/InvalidateVehicleVersionId.exception";
import { InvalidVehicleCatalogIdException } from "../../../exceptions/invalid-vehicle-catalog-id.exception";
import { InvalidVehicleFeatureIdsException } from "../../../exceptions/invalid-vehicle-feature-ids.exception";
import { InvalidVehicleServiceIdsException } from "../../../exceptions/invalid-vehicle-service-ids.exception";
import { NewVehicleMileageException } from "../../../exceptions/newVehicleMilleage.exception";
import { CategoryEntity } from "../../../entities/category.entity";
import { ColorEntity } from "../../../entities/color.entity";
import { CuotaEntity } from "../../../entities/cuota.entity";
import { DgtLabelEntity } from "../../../entities/dgt-label.entity";
import { FeaturesEntity } from "../../../entities/features.entity";
import { ServiceEntity } from "../../../entities/service.entity";
import { TractionEntity } from "../../../entities/traction.entity";
import { VehicleTypeEntity } from "../../../entities/vehicle-type.entity";
import { VehicleEntity } from "../../../entities/vehicle.entity";
import { VideosEntity } from "../../../entities/videos.entity";
import { WarrantyTypeEntity } from "../../../entities/warranty-type.entity";
import { VehicleListingExpiryScheduler } from "../../../queues/vehicle-listing-expiry.scheduler";
import { TypeOrmVehicleRepository } from "../../../repositories/typeorm.vehicle-repository";
import { VehicleSearchIndexer } from "../../../search/indexing/vehicle-search-indexer.service";
import { formatAddressText } from "../../../services/format-vehicle-address";
import { ReverseGeocodingService } from "../../../services/reverse-geocoding.service";
import {
  CONDITION_VEHICLE,
  PUBLISHER_TYPE,
  STATUS_VEHICLE,
} from "../../../types/vehicle";
import { formatVehicleDisplayName } from "../../../utils/format-vehicle-display-name";
import { VehicleImagesEntity } from "../../../vehicle-images/entities/vehicle-images.entity";
import { VehiclePriceEntity } from "../../../vehicle-prices/entities/vehicle-price.entity";
import { VEHICLE_PRICE_STATUS } from "../../../vehicle-prices/types/vehicle-price";
import { buildMailVehicleCard } from "@/src/contexts/shared/mail/mail-vehicle-card";
import { CreateVehicleDto, VehicleMediaDto } from "./create-vehicle.http-dto";

const MAX_MILEAGE_FOR_NEW_VEHICLE = 1000;
const VEHICLE_LISTING_LIFETIME_MS = 90 * 24 * 60 * 60 * 1000;

interface ValidateVehicleCreationRulesInput {
  battery_capacity: number;
  time_to_charge: number;
  autonomy: number;
  displacement: number;
  mileage: number;
  condition: CreateVehicleDto["condition"];
  can_charge: boolean;
}

export function validateVehicleCreationRules(
  input: ValidateVehicleCreationRulesInput,
): string[] {
  if (
    !input.can_charge &&
    (input.battery_capacity > 0 ||
      input.autonomy > 0 ||
      input.time_to_charge > 0)
  ) {
    throw new FuelIncompatibilitiesException();
  }

  if (
    input.mileage > MAX_MILEAGE_FOR_NEW_VEHICLE &&
    input.condition === CONDITION_VEHICLE.NEW
  ) {
    throw new NewVehicleMileageException();
  }

  const suggestions: string[] = [];
  if (
    input.mileage < MAX_MILEAGE_FOR_NEW_VEHICLE &&
    input.condition === CONDITION_VEHICLE.USED
  ) {
    suggestions.push(
      "Tu vehículo tiene menos de 1000 km, podrías considerarlo como nuevo para obtener una mejor visibilidad en la plataforma.",
    );
  }

  if (input.can_charge && input.displacement > 0) {
    throw new ElectricDisplacementException();
  }

  return suggestions;
}

interface PromotedVehicleMedia {
  images: VehicleMediaDto[];
  videos: VehicleMediaDto[];
}

@Injectable()
export class CreateVehicleService {
  private readonly logger = new Logger(CreateVehicleService.name);

  constructor(
    @InjectDataSource()
    private readonly data_source: DataSource,
    private readonly catalog_versions_service: CatalogVersionsService,
    private readonly catalog_fuel_types_service: CatalogFuelTypesService,
    private readonly reverse_geocoding_service: ReverseGeocodingService,
    private readonly promote_temp_storage_paths_service: PromoteTempStoragePathsService,
    private readonly vehicle_search_indexer: VehicleSearchIndexer,
    private readonly vehicle_listing_expiry_scheduler: VehicleListingExpiryScheduler,
    private readonly profile_user_repository: TypeOrmProfileUserRepository,
    private readonly vehicle_repository: TypeOrmVehicleRepository,
    private readonly outbound_mail_enqueue_service: OutboundMailEnqueueService,
  ) {}

  async create(dto: CreateVehicleDto, publisher_profile_id: string) {
    const version_id = dto.version_id;
    if (!Number.isInteger(version_id) || version_id < 1) {
      throw new InvalidateVehicleVersionIdException();
    }

    const version = await this.catalog_versions_service.findById(version_id);
    if (!version) {
      throw new InvalidateVehicleVersionIdException();
    }

    const fuel_type = await this.catalog_fuel_types_service.findById(
      version.fuel_type_id,
    );
    if (!fuel_type) {
      throw new CatalogFuelTypeNotFoundException(version.fuel_type_id);
    }

    const suggestions = validateVehicleCreationRules({
      battery_capacity: dto.battery_capacity ?? 0,
      time_to_charge: dto.time_to_charge ?? 0,
      autonomy: dto.autonomy ?? 0,
      displacement: dto.displacement ?? 0,
      mileage: dto.mileage,
      condition: dto.condition,
      can_charge: fuel_type.can_charge,
    });

    const [resolved_address, membership, media] = await Promise.all([
      this.reverse_geocoding_service.resolve(dto.lat, dto.lng),
      this.data_source.getRepository(DealershipMembersEntity).findOne({
        where: { profile_id: publisher_profile_id },
      }),
      this.promoteMedia(dto.images ?? [], dto.videos ?? []),
    ]);

    const now = new Date();
    const expires_at = new Date(now.getTime() + VEHICLE_LISTING_LIFETIME_MS);
    const publisher_type = membership
      ? PUBLISHER_TYPE.DEALERSHIP
      : PUBLISHER_TYPE.PARTICULAR;

    const vehicle = await this.data_source.transaction(async (manager) => {
      const relations = await this.loadAndValidateRelations(manager, dto);
      const entity = manager.create(VehicleEntity, {
        vin_code: dto.vin_code?.trim() ?? "",
        profile_id: publisher_profile_id,
        dealership_id: membership?.dealership_id ?? null,
        mileage: dto.mileage,
        lat: dto.lat,
        lng: dto.lng,
        condition: dto.condition,
        description: dto.description?.trim() ?? "",
        version_id,
        publisher_type,
        status: STATUS_VEHICLE.PENDING,
        status_change_message: null,
        transmission_type: dto.transmission_type,
        traction_id: dto.traction_id,
        power: dto.power ?? 0,
        displacement: dto.displacement ?? 0,
        autonomy: dto.autonomy ?? 0,
        battery_capacity: dto.battery_capacity ?? 0,
        time_to_charge: dto.time_to_charge ?? 0,
        license_plate: dto.license_plate?.trim() ?? "",
        phone_code: dto.phone_code,
        phone: dto.phone,
        has_whatsapp: dto.has_whatsapp ?? false,
        show_phone: dto.show_phone ?? true,
        email: dto.email,
        vehicle_type_id: dto.vehicle_type_id ?? null,
        category_id: dto.category_id ?? null,
        color_id: dto.color_id ?? null,
        dgt_label_id: dto.dgt_label_id ?? null,
        warranty_type_id: dto.warranty_type_id ?? null,
        features: relations.features,
        services: relations.services,
        cuotas: relations.cuotas,
        suggestions,
        address: resolved_address
          ? formatAddressText(resolved_address.formatted_lines)
          : null,
        address_details: resolved_address,
        expires_at,
        scheduled_publish_at: null,
        renewed_at: null,
        is_featured: false,
        featured_expires_at: null,
        featured_boost_weight: null,
        views: 0,
        favorites: 0,
        shares: 0,
        finance_price: dto.finance_price ?? null,
        first_cuota: dto.first_cuota ?? null,
        show_exact_location: dto.show_exact_location ?? false,
        by_brand_warranty: dto.by_brand_warranty ?? false,
        show_first_cuota: dto.show_first_cuota ?? false,
      });

      const saved = await manager.save(VehicleEntity, entity);
      await manager.save(
        VehiclePriceEntity,
        manager.create(VehiclePriceEntity, {
          vehicle_id: saved.id,
          price: dto.price,
          status: VEHICLE_PRICE_STATUS.ACTIVE,
        }),
      );

      if (media.images.length > 0) {
        await manager.save(
          VehicleImagesEntity,
          media.images.map((image) =>
            manager.create(VehicleImagesEntity, {
              vehicle_id: saved.id,
              url: image.path,
              order: image.order,
            }),
          ),
        );
      }

      if (media.videos.length > 0) {
        await manager.save(
          VideosEntity,
          media.videos.map((video) =>
            manager.create(VideosEntity, {
              vehicle_id: saved.id,
              url: video.path,
              order: video.order,
              status: "active",
            }),
          ),
        );
      }

      return saved;
    });

    await Promise.all([
      this.runPostCommitEffect("search sync", vehicle.id, () =>
        this.vehicle_search_indexer.syncVehicle(
          vehicle.id,
          STATUS_VEHICLE.PENDING,
        ),
      ),
      this.runPostCommitEffect("expiry scheduling", vehicle.id, () =>
        this.vehicle_listing_expiry_scheduler.scheduleForVehicle(
          vehicle.id,
          expires_at,
          now,
        ),
      ),
      this.runPostCommitEffect("published mail", vehicle.id, () =>
        this.enqueuePublishedMail(vehicle.id, publisher_profile_id),
      ),
    ]);

    return {
      vehicle: {
        id: vehicle.id,
        ref: vehicle.ref,
        mileage: vehicle.mileage,
        lat: Number(vehicle.lat),
        lng: Number(vehicle.lng),
        condition: vehicle.condition,
        description: vehicle.description ?? "",
        publisher_type: vehicle.publisher_type,
        version_id: vehicle.version_id,
        status: vehicle.status,
        status_change_message: vehicle.status_change_message ?? null,
        is_featured: vehicle.is_featured,
        featured_expires_at: vehicle.featured_expires_at,
        featured_boost_weight: vehicle.featured_boost_weight,
        expires_at: vehicle.expires_at,
        scheduled_publish_at: vehicle.scheduled_publish_at,
        renewed_at: vehicle.renewed_at,
        views: vehicle.views,
        favorites: vehicle.favorites,
        shares: vehicle.shares,
        address: vehicle.address ?? null,
        address_details: vehicle.address_details ?? null,
        transmission_type: vehicle.transmission_type,
        traction_id: vehicle.traction_id,
        power: vehicle.power,
        displacement: vehicle.displacement,
        autonomy: vehicle.autonomy,
        battery_capacity: vehicle.battery_capacity,
        time_to_charge: vehicle.time_to_charge,
        license_plate: vehicle.license_plate,
        vin_code: vehicle.vin_code,
        phone_code: vehicle.phone_code,
        phone: vehicle.phone,
        has_whatsapp: vehicle.has_whatsapp,
        show_phone: vehicle.show_phone,
        email: vehicle.email,
        created_at: vehicle.created_at,
        updated_at: vehicle.updated_at,
        features_ids: relationsIds(vehicle.features),
        services_ids: relationsIds(vehicle.services),
        vehicle_type_id: vehicle.vehicle_type_id,
        category_id: vehicle.category_id,
        color_id: vehicle.color_id,
        dgt_label_id: vehicle.dgt_label_id,
        warranty_type_id: vehicle.warranty_type_id,
        cuota_ids: relationsIds(vehicle.cuotas),
        suggestions: vehicle.suggestions,
        profile_id: vehicle.profile_id ?? undefined,
        dealership_id: vehicle.dealership_id ?? undefined,
        finance_price: vehicle.finance_price,
        first_cuota: vehicle.first_cuota,
        show_exact_location: vehicle.show_exact_location,
        by_brand_warranty: vehicle.by_brand_warranty,
        show_first_cuota: vehicle.show_first_cuota,
      },
    };
  }

  private async promoteMedia(
    images: VehicleMediaDto[],
    videos: VehicleMediaDto[],
  ): Promise<PromotedVehicleMedia> {
    const ordered_images = [...images].sort((a, b) => a.order - b.order);
    const ordered_videos = [...videos].sort((a, b) => a.order - b.order);
    const all_media = [...ordered_images, ...ordered_videos];
    if (all_media.length === 0) {
      return { images: [], videos: [] };
    }

    const { pathnames } =
      await this.promote_temp_storage_paths_service.execute({
        paths: all_media.map((item) => item.path),
      });
    if (pathnames.length !== all_media.length) {
      throw new Error("No se pudieron promover todos los medios del vehículo");
    }

    return {
      images: ordered_images.map((image, index) => ({
        ...image,
        path: pathnames[index],
      })),
      videos: ordered_videos.map((video, index) => ({
        ...video,
        path: pathnames[ordered_images.length + index],
      })),
    };
  }

  private async loadAndValidateRelations(
    manager: EntityManager,
    dto: CreateVehicleDto,
  ) {
    const feature_ids = uniqueIds(dto.features_ids);
    const service_ids = uniqueIds(dto.services_ids);
    const cuota_ids = uniqueIds(dto.cuota_ids);
    const [features, services, cuotas] = await Promise.all([
      feature_ids.length > 0
        ? manager.findBy(FeaturesEntity, { id: In(feature_ids) })
        : [],
      service_ids.length > 0
        ? manager.findBy(ServiceEntity, { id: In(service_ids) })
        : [],
      cuota_ids.length > 0
        ? manager.findBy(CuotaEntity, { id: In(cuota_ids) })
        : [],
    ]);

    if (features.length !== feature_ids.length) {
      const found = new Set(features.map((feature) => feature.id));
      throw new InvalidVehicleFeatureIdsException(
        feature_ids.filter((id) => !found.has(id)),
      );
    }
    if (services.length !== service_ids.length) {
      const found = new Set(services.map((service) => service.id));
      throw new InvalidVehicleServiceIdsException(
        service_ids.filter((id) => !found.has(id)),
      );
    }
    if (cuotas.length !== cuota_ids.length) {
      const found = new Set(cuotas.map((cuota) => cuota.id));
      const missing = cuota_ids.find((id) => !found.has(id));
      throw new InvalidVehicleCatalogIdException("cuota_ids", missing ?? "");
    }

    await Promise.all([
      this.assertOptionalRelation(
        manager,
        VehicleTypeEntity,
        dto.vehicle_type_id,
        "vehicle_type_id",
      ),
      this.assertOptionalRelation(
        manager,
        CategoryEntity,
        dto.category_id,
        "category_id",
      ),
      this.assertOptionalRelation(
        manager,
        ColorEntity,
        dto.color_id,
        "color_id",
      ),
      this.assertOptionalRelation(
        manager,
        DgtLabelEntity,
        dto.dgt_label_id,
        "dgt_label_id",
      ),
      this.assertOptionalRelation(
        manager,
        WarrantyTypeEntity,
        dto.warranty_type_id,
        "warranty_type_id",
      ),
      this.assertOptionalRelation(
        manager,
        TractionEntity,
        dto.traction_id,
        "traction_id",
      ),
    ]);

    return { features, services, cuotas };
  }

  private async assertOptionalRelation(
    manager: EntityManager,
    entity: EntityTarget<{ id: string }>,
    id: string | null | undefined,
    field: string,
  ): Promise<void> {
    if (!id) {
      return;
    }
    const exists = await manager.exists(entity, { where: { id } });
    if (!exists) {
      throw new InvalidVehicleCatalogIdException(field, id);
    }
  }

  private async enqueuePublishedMail(
    vehicle_id: string,
    publisher_profile_id: string,
  ): Promise<void> {
    const [publisher_email, detail] = await Promise.all([
      this.profile_user_repository.findEmailById(publisher_profile_id),
      this.vehicle_repository.findOne(vehicle_id),
    ]);
    if (!publisher_email || !detail) {
      return;
    }

    const title = formatVehicleDisplayName({
      make_name: detail.version.make.name,
      model_name: detail.version.model.name,
      version_name: detail.version.name,
    });
    await this.outbound_mail_enqueue_service.enqueue_vehicle_published({
      to: publisher_email,
      vehicle: buildMailVehicleCard({
        id: detail.id,
        title,
        price: detail.price,
        image_url: detail.images[0]?.url ?? null,
        year: detail.version.year.year,
        mileage: detail.mileage,
        fuel_type_slug: detail.version.fuel_type.slug,
        transmission_type: detail.transmission_type,
        location_label: detail.address ?? undefined,
        publisher_type: detail.publisher_type,
      }),
    });
  }

  private async runPostCommitEffect(
    effect: string,
    vehicle_id: string,
    callback: () => Promise<void>,
  ): Promise<void> {
    try {
      await callback();
    } catch (error) {
      this.logger.error(
        `Post-commit ${effect} failed for vehicle ${vehicle_id}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}

const uniqueIds = (ids: string[] | undefined): string[] => [
  ...new Set(ids ?? []),
];

const relationsIds = (
  relations: { id: string }[] | undefined,
): string[] => relations?.map((relation) => relation.id) ?? [];
