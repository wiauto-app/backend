import { OutboundMailEnqueueService } from "@/src/contexts/shared/mail/outbound-mail-enqueue.service";
import { TypeOrmProfileUserRepository } from "@/src/contexts/profiles/repositories/typeorm.profile-user-repository";
import { PromoteTempStoragePathsService } from "@/src/contexts/shared/file/services/promote-temp-storage-paths.service";
import { DealershipMembersEntity } from "@/src/contexts/dealership/entities/dealership-members.entity";
import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, EntityManager, EntityTarget, In } from "typeorm";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { PROCESS_VEHICLE_IMAGE_QUEUE } from "@/src/contexts/shared/file/media.constants";
import { TempUploadService } from "@/src/contexts/vehicles/vehicle-images/services/temp-upload.service";
import type { ProcessVehicleImageJob } from "@/src/contexts/shared/file/processors/process-vehicle-image.processor";

import { CatalogFuelTypeNotFoundException } from "../../../catalog/fuel_types/exceptions/catalog-fuel-type-not-found.exception";
import { CatalogFuelTypesService } from "../../../catalog/fuel_types/services/catalog-fuel-types.service";
import { CatalogVersionsService } from "../../../catalog/versions/services/catalog-versions.service";
import { InvalidateVehicleVersionIdException } from "../../../exceptions/InvalidateVehicleVersionId.exception";
import { InvalidVehicleCatalogIdException } from "../../../exceptions/invalid-vehicle-catalog-id.exception";
import { InvalidVehicleFeatureIdsException } from "../../../exceptions/invalid-vehicle-feature-ids.exception";
import { InvalidVehicleServiceIdsException } from "../../../exceptions/invalid-vehicle-service-ids.exception";
import {
  isVehicleRefUniqueViolation,
  VehicleRefAlreadyExistsException,
} from "../../../exceptions/vehicle-ref-already-exists.exception";
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
import { PUBLISHER_TYPE, STATUS_VEHICLE } from "../../../types/vehicle";
import { formatVehicleDisplayName } from "../../../utils/format-vehicle-display-name";
import { VehicleImagesEntity } from "../../../vehicle-images/entities/vehicle-images.entity";
import { VehiclePriceEntity } from "../../../vehicle-prices/entities/vehicle-price.entity";
import { VEHICLE_PRICE_STATUS } from "../../../vehicle-prices/types/vehicle-price";
import { buildMailVehicleCard } from "@/src/contexts/shared/mail/mail-vehicle-card";
import {
  CreateVehicleDto,
  VehicleImageDto,
  VehicleMediaDto,
} from "./create-vehicle.http-dto";
import { validateVehicleCreationRules } from "../../../services/validate-vehicle-creation-rules";

export { validateVehicleCreationRules } from "../../../services/validate-vehicle-creation-rules";

const VEHICLE_LISTING_LIFETIME_MS = 90 * 24 * 60 * 60 * 1000;

interface PromotedVehicleMedia {
  images: { path: string; order: number }[];
  videos: VehicleMediaDto[];
}

interface AsyncVehicleImageInput {
  upload_id: string;
  order: number;
}

const partitionVehicleImages = (
  images: VehicleImageDto[] | undefined,
): {
  async_images: AsyncVehicleImageInput[];
  legacy_images: { path: string; order: number }[];
} => {
  const async_images: AsyncVehicleImageInput[] = [];
  const legacy_images: { path: string; order: number }[] = [];

  for (const image of images ?? []) {
    if (image.upload_id) {
      async_images.push({ upload_id: image.upload_id, order: image.order });
      continue;
    }
    if (image.path) {
      legacy_images.push({ path: image.path, order: image.order });
    }
  }

  return { async_images, legacy_images };
};

interface CreateVehicleRollbackContext {
  vehicle_id: string | null;
  temp_media_paths: string[];
}

@Injectable()
export class CreateVehicleService {
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
    @InjectQueue(PROCESS_VEHICLE_IMAGE_QUEUE)
    private readonly imageQueue: Queue<ProcessVehicleImageJob>,
    private readonly tempUploadService: TempUploadService,
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

    const [resolved_address, membership] = await Promise.all([
      this.reverse_geocoding_service.resolve(dto.lat, dto.lng),
      this.data_source.getRepository(DealershipMembersEntity).findOne({
        where: { profile_id: publisher_profile_id },
      }),
    ]);

    const now = new Date();
    const expires_at = new Date(now.getTime() + VEHICLE_LISTING_LIFETIME_MS);
    const publisher_type = membership
      ? PUBLISHER_TYPE.DEALERSHIP
      : PUBLISHER_TYPE.PARTICULAR;

    const { async_images, legacy_images } = partitionVehicleImages(dto.images);
    const useAsyncFlow = async_images.length > 0;
    const temp_media_paths = [
      ...legacy_images.toSorted((a, b) => a.order - b.order),
      ...(dto.videos ?? []).toSorted((a, b) => a.order - b.order),
    ].map(item => item.path);

    let media_promoted = false;
    let vehicle: VehicleEntity | null = null;
    const enqueuedImageIds: string[] = [];
    let validatedTempUploads: Awaited<
      ReturnType<typeof this.tempUploadService.validateAndGetTempUpload>
    >[] = [];

    try {
      if (useAsyncFlow) {
        validatedTempUploads = await Promise.all(
          async_images.map(img =>
            this.tempUploadService.validateAndGetTempUpload(
              img.upload_id,
              publisher_profile_id,
            ),
          ),
        );
      }

      const media = await this.promoteMedia(legacy_images, dto.videos ?? []);
      media_promoted = temp_media_paths.length > 0;

      vehicle = await this.data_source.transaction(async manager => {
        const relations = await this.loadAndValidateRelations(manager, dto);
        const entity = manager.create(VehicleEntity, {
          ref: dto.ref?.trim() || null,
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
          status: STATUS_VEHICLE.ACTIVE,
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
          show_review_collab: dto.show_review_collab ?? false,
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

        // Flujo async: crear VehicleImages con status=uploaded
        if (useAsyncFlow) {
          const imageEntities = async_images.map((img, index) => {
            const tempUpload = validatedTempUploads[index];
            return manager.create(VehicleImagesEntity, {
              vehicle_id: saved.id,
              order: img.order,
              status: "uploaded",
              source_path: tempUpload.storage_path,
              url: tempUpload.storage_path,
            });
          });

          const savedImages = await manager.save(
            VehicleImagesEntity,
            imageEntities,
          );
          enqueuedImageIds.push(...savedImages.map(img => img.id));

          await this.tempUploadService.markAsConsumed(
            async_images.map(img => img.upload_id),
          );
        }

        // Flujo legacy: crear con media ya promovida
        if (media.images.length > 0) {
          await manager.save(
            VehicleImagesEntity,
            media.images.map(image =>
              manager.create(VehicleImagesEntity, {
                vehicle_id: saved.id,
                url: image.path,
                order: image.order,
                status: "ready",
              }),
            ),
          );
        }

        if (media.videos.length > 0) {
          await manager.save(
            VideosEntity,
            media.videos.map(video =>
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

      // Encolar procesamiento de imágenes FUERA de la transacción
      if (enqueuedImageIds.length > 0) {
        const vehicleId = vehicle.id;
        const jobs = async_images.map((img, index) => {
          const imageId = enqueuedImageIds[index];
          const tempUpload = validatedTempUploads[index];

          return {
            name: `process-vehicle-image-${imageId}`,
            data: {
              image_id: imageId,
              vehicle_id: vehicleId,
              source_path: tempUpload.storage_path,
            } as ProcessVehicleImageJob,
            opts: {
              priority: img.order === 0 ? 1 : 5,
              attempts: 3,
              backoff: { type: "exponential", delay: 2000 },
            },
          };
        });

        await this.imageQueue.addBulk(jobs);
      }

      await this.vehicle_search_indexer.syncVehicle(
        vehicle.id,
        STATUS_VEHICLE.PENDING,
      );
      await this.vehicle_listing_expiry_scheduler.scheduleForVehicle(
        vehicle.id,
        expires_at,
        now,
      );
      await this.enqueuePublishedMail(vehicle.id, publisher_profile_id);
    } catch (error) {
      try {
        await this.rollback({
          vehicle_id: vehicle?.id ?? null,
          temp_media_paths: media_promoted ? temp_media_paths : [],
        });
      } catch (rollback_error) {
        throw new AggregateError(
          [error, rollback_error],
          "Falló la creación del vehículo y también su rollback",
        );
      }

      if (isVehicleRefUniqueViolation(error)) {
        throw new VehicleRefAlreadyExistsException();
      }

      throw error;
    }

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
        show_review_collab: vehicle.show_review_collab,
      },
    };
  }

  private async promoteMedia(
    images: { path: string; order: number }[],
    videos: VehicleMediaDto[],
  ): Promise<PromotedVehicleMedia> {
    const ordered_images = [...images].sort((a, b) => a.order - b.order);
    const ordered_videos = [...videos].sort((a, b) => a.order - b.order);
    const all_media = [...ordered_images, ...ordered_videos];
    if (all_media.length === 0) {
      return { images: [], videos: [] };
    }

    const { pathnames } = await this.promote_temp_storage_paths_service.execute(
      {
        paths: all_media.map(item => item.path),
      },
    );
    if (pathnames.length !== all_media.length) {
      const promotion_error = new Error(
        "No se pudieron promover todos los medios del vehículo",
      );
      try {
        await this.promote_temp_storage_paths_service.rollback({
          paths: all_media.map(item => item.path),
        });
      } catch (rollback_error) {
        throw new AggregateError(
          [promotion_error, rollback_error],
          "La promoción de medios quedó incompleta y su rollback falló",
        );
      }

      throw promotion_error;
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

  private async rollback({
    vehicle_id,
    temp_media_paths,
  }: CreateVehicleRollbackContext): Promise<void> {
    const operations: Promise<unknown>[] = [];

    if (vehicle_id) {
      operations.push(
        this.data_source.transaction(async manager => {
          await manager.delete(VehicleEntity, { id: vehicle_id });
        }),
        this.vehicle_listing_expiry_scheduler.cancelForVehicle(vehicle_id),
        this.vehicle_search_indexer.deleteVehicle(vehicle_id),
      );
    }

    if (temp_media_paths.length > 0) {
      operations.push(
        this.promote_temp_storage_paths_service.rollback({
          paths: temp_media_paths,
        }),
      );
    }

    const results = await Promise.allSettled(operations);
    const failures = results
      .filter(result => result.status === "rejected")
      .map(result => result.reason as unknown);

    if (failures.length > 0) {
      throw new AggregateError(
        failures,
        "No se pudo completar el rollback de la creación del vehículo",
      );
    }
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
      const found = new Set(features.map(feature => feature.id));
      throw new InvalidVehicleFeatureIdsException(
        feature_ids.filter(id => !found.has(id)),
      );
    }
    if (services.length !== service_ids.length) {
      const found = new Set(services.map(service => service.id));
      throw new InvalidVehicleServiceIdsException(
        service_ids.filter(id => !found.has(id)),
      );
    }
    if (cuotas.length !== cuota_ids.length) {
      const found = new Set(cuotas.map(cuota => cuota.id));
      const missing = cuota_ids.find(id => !found.has(id));
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
}

const uniqueIds = (ids: string[] | undefined): string[] => [
  ...new Set(ids ?? []),
];

const relationsIds = (relations: { id: string }[] | undefined): string[] =>
  relations?.map(relation => relation.id) ?? [];
