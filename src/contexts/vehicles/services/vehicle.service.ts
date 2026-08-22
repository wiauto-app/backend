import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { OutboundMailEnqueueService } from "@/src/contexts/shared/mail/outbound-mail-enqueue.service";
import { AlertProcessingEnqueueService } from "@/src/contexts/alerts/queues/alert-processing-enqueue.service";
import { ALERT_EVENT_TYPE } from "@/src/contexts/alerts/types/alert-event-type.enum";
import { TypeOrmProfileUserRepository } from "@/src/contexts/profiles/repositories/typeorm.profile-user-repository";

import { CatalogFuelTypesService } from "../catalog/fuel_types/services/catalog-fuel-types.service";
import { CatalogModelsService } from "../catalog/models/services/catalog-models.service";
import { MakesService } from "../catalog/makes/services/makes.service";
import { CatalogVersionsService } from "../catalog/versions/services/catalog-versions.service";
import { CatalogYearsService } from "../catalog/years/services/catalog-years.service";
import {
  ConditionVehicle,
  applyVehicleUpdates,
  PUBLISHER_TYPE,
  STATUS_VEHICLE,
  StatusVehicle,
  TransmissionType,
  VehicleUpdateFields,
  type PublisherType,
} from "../types/vehicle";
import { CatalogFuelTypeNotFoundException } from "../catalog/fuel_types/exceptions/catalog-fuel-type-not-found.exception";
import { InvalidateVehicleVersionIdException } from "../exceptions/InvalidateVehicleVersionId.exception";
import { VehicleNotFoundException } from "../exceptions/vehicle-not-found.exception";
import { AdminVehicleFilter } from "../types/admin-vehicle.filter";
import { OwnerVehicleFilter } from "../types/owner-vehicle.filter";
import { VehicleFilter } from "../types/vehicle.filter";
import { AdminVehicleDetail } from "../types/admin-vehicle-detail";
import {
  vehicleDetailToPrimitives,
  VehicleDetail,
} from "../types/vehicle-detail";
import type { SellerContactFields } from "../types/seller-contact-fields";
import { OwnerVehicleListItem } from "../types/owner-vehicle-list-item";
import {
  AdminVehicleListItem,
  VehicleListItem,
} from "../types/vehicle-list-item";
import { formatVehicleDisplayName } from "../utils/format-vehicle-display-name";
import {
  canFeatureVehicle,
  canRenewVehicle,
  canScheduleVehicle,
  computeRenewedExpiresAt,
  isFeaturedActive,
  SCHEDULE_MAX_FUTURE_MS,
} from "../utils/owner-vehicle-rules";
import { buildMailVehicleCard } from "@/src/contexts/shared/mail/mail-vehicle-card";
import type { MailVehicleCardPayload } from "@/src/contexts/shared/mail/mail-vehicle-card";
import { VehicleListingExpiryScheduler } from "../queues/vehicle-listing-expiry.scheduler";
import { AdminFindAllVehiclesDto } from "../dto/admin-find-all-vehicles.dto";
import { AdminGetVehicleDto } from "../dto/admin-get-vehicle.dto";
import { AdminUpdateVehicleStatusDto } from "../dto/admin-update-vehicle-status.dto";
import { DuplicateVehicleDto } from "../dto/duplicate-vehicle.dto";
import { FindAllVehiclesUseCaseDto } from "../dto/find-all-vehicles.dto";
import { FindOwnerVehiclesDto } from "../dto/find-owner-vehicles.dto";
import { FindSimilarVehiclesDto } from "../dto/find-similar-vehicles.dto";
import { GetVehicleDto } from "../dto/get-vehicle.dto";
import { GetVehicleReportDto } from "../dto/get-vehicle-report.dto";
import { VehicleReport } from "../types/vehicle-report";
import { RemoveVehicleDto } from "../dto/remove-vehicle.dto";
import { FeatureVehicleDto } from "../dto/feature-vehicle.dto";
import { RenewVehicleDto } from "../dto/renew-vehicle.dto";
import { ScheduleVehicleDto } from "../dto/schedule-vehicle.dto";
import { UpdateOwnerVehicleStatusDto } from "../dto/update-owner-vehicle-status.dto";
import { UpdateVehicleDto } from "../dto/update-vehicle.dto";
import { VehicleListItemDto } from "../dto/vehicle-list-item.dto";
import { ReverseGeocodingPort } from "../ports/reverse-geocoding.port";
import { formatAddressText } from "../services/format-vehicle-address";
import { TypeOrmVehicleRepository } from "../repositories/typeorm.vehicle-repository";
import { VehicleSearchIndexer } from "../search/indexing/vehicle-search-indexer.service";
import { AttachVehicleImagesFromTempService } from "../vehicle-images/services/attach-vehicle-images-from-temp.service";
import { TypeOrmVehicleImagesRepository } from "@/src/contexts/vehicles/vehicle-images/repositories/typeorm.vehicle-images.repository";
import { SetVehiclePriceService } from "../vehicle-prices/services/set-vehicle-price.service";
import { BillingNotificationMailService } from "@/src/contexts/billing/services/billing-notification-mail.service";
import { EntitlementsService } from "@/src/contexts/billing/services/entitlements.service";
import { TypeOrmDealershipMemberRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-member-repository";
import { DismissedVehiclesService } from "../vehicle-engagement/services/dismissed-vehicles.service";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { VehicleEntity } from "../entities/vehicle.entity";
import { validateVehicleCreationRules } from "./validate-vehicle-creation-rules";
import { PromoteTempStoragePathsService } from "../../shared/file/services/promote-temp-storage-paths.service";
import { VideosEntity } from "../entities/videos.entity";

const SIMILAR_RADIUS_METERS = 100_000;
const TIER1_YEAR_DELTA = 1;
const TIER2_YEAR_DELTA = 2;
const MILEAGE_TOLERANCE_RATIO = 0.3;

export type SimilarVehiclesTier = 1 | 2;

export interface FindSimilarVehiclesListingHrefSlugs {
  make: string;
  model: string;
}

export interface FindSimilarVehiclesResult {
  data: VehicleListItem[];
  total: number;
  page: number;
  limit: number;
  tier: SimilarVehiclesTier;
  listing_href_slugs: FindSimilarVehiclesListingHrefSlugs;
}

interface ResolvedVehicleCatalog {
  make_slug: string;
  model_slug: string;
  year: number;
  fuel_type_slug: string;
}

@Injectable()
export class VehicleService {
  constructor(
    private readonly vehicle_repository: TypeOrmVehicleRepository,
    private readonly attach_vehicle_images_from_temp_service: AttachVehicleImagesFromTempService,
    private readonly set_vehicle_price_service: SetVehiclePriceService,
    private readonly vehicle_image_repository: TypeOrmVehicleImagesRepository,
    private readonly vehicle_search_indexer: VehicleSearchIndexer,
    private readonly reverse_geocoding_port: ReverseGeocodingPort,
    private readonly alert_processing_enqueue_service: AlertProcessingEnqueueService,
    private readonly catalog_versions_service: CatalogVersionsService,
    private readonly catalog_fuel_types_service: CatalogFuelTypesService,
    private readonly makes_service: MakesService,
    private readonly catalog_models_service: CatalogModelsService,
    private readonly catalog_years_service: CatalogYearsService,
    private readonly profile_user_repository: TypeOrmProfileUserRepository,
    private readonly outbound_mail_enqueue_service: OutboundMailEnqueueService,
    private readonly vehicle_listing_expiry_scheduler: VehicleListingExpiryScheduler,
    private readonly billing_notification_mail_service: BillingNotificationMailService,
    private readonly dismissed_vehicles_service: DismissedVehiclesService,
    private readonly dealership_member_repository: TypeOrmDealershipMemberRepository,
    @InjectRepository(VehicleEntity)
    private readonly vehicleRepository: Repository<VehicleEntity>,
    @InjectRepository(VideosEntity)
    private readonly videos_repository: Repository<VideosEntity>,
    private readonly promote_temp_storage_paths_service: PromoteTempStoragePathsService,
    private readonly entitlements_service: EntitlementsService,
  ) { }

  private async resolvePublisherContext(
    profile_id: string,
  ): Promise<{
    publisher_type: PublisherType;
    dealership_id: string | null;
  }> {
    const membership =
      await this.dealership_member_repository.findOneByProfileId(profile_id);
    if (!membership) {
      return {
        publisher_type: PUBLISHER_TYPE.PARTICULAR,
        dealership_id: null,
      };
    }

    return {
      publisher_type: PUBLISHER_TYPE.DEALERSHIP,
      dealership_id: membership.toPrimitives().dealership_id,
    };
  }

  async findOne(get_vehicle_dto: GetVehicleDto,profile_id?: string): Promise<VehicleDetail> {
    const vehicle = await this.vehicle_repository.findOne(get_vehicle_dto.id,profile_id);
    if (!vehicle) {
      throw new VehicleNotFoundException(get_vehicle_dto.id);
    }
    return vehicle;
  }

  async findActiveIdByRef(ref: number): Promise<{ id: string }> {
    const id = await this.vehicle_repository.findActiveIdByRef(ref);
    if (!id) {
      throw new NotFoundException(
        `No se encontró un vehículo activo con referencia ${ref}`,
      );
    }
    return { id };
  }

  async findSellerContactFields(id: string): Promise<SellerContactFields> {
    const fields = await this.vehicle_repository.findSellerContactFields(id);
    if (!fields) {
      throw new VehicleNotFoundException(id);
    }
    return fields;
  }

  async findAll(
    find_all_vehicles_dto: FindAllVehiclesUseCaseDto,
    profile_id?: string,
  ): Promise<PaginatedResult<VehicleListItemDto>> {
    const exclude_vehicle_ids = [
      ...find_all_vehicles_dto.exclude_vehicle_ids,
    ];

    if (profile_id) {
      const dismissed_ids =
        await this.dismissed_vehicles_service.findVehicleIdsByProfileId(
          profile_id,
        );
      for (const vehicle_id of dismissed_ids) {
        if (!exclude_vehicle_ids.includes(vehicle_id)) {
          exclude_vehicle_ids.push(vehicle_id);
        }
      }
    }

    const filter = new VehicleFilter({
      ...find_all_vehicles_dto,
      exclude_vehicle_ids,
    });
    return this.vehicle_repository.findAll(filter);
  }

  async update(update_vehicle_dto: UpdateVehicleDto) {
    const existing = await this.vehicle_repository.findOne(update_vehicle_dto.id);
    if (!existing) {
      throw new VehicleNotFoundException(update_vehicle_dto.id);
    }

    const { id, images, videos, price, vehicle_price_id, ...dto_fields } =
      update_vehicle_dto;
    const existing_primitive = vehicleDetailToPrimitives(existing);

    const patch = Object.fromEntries(
      Object.entries(dto_fields as Record<string, unknown>).filter(
        ([, value]) => value !== undefined,
      ),
    ) as VehicleUpdateFields;

    const publisher_context = await this.resolvePublisherContext(
      existing.profile_id,
    );
    if (publisher_context.publisher_type !== existing.publisher_type) {
      patch.publisher_type = publisher_context.publisher_type;
    }
    if (publisher_context.dealership_id !== existing_primitive.dealership_id) {
      patch.dealership_id = publisher_context.dealership_id;
    }

    const coordinates_changed =
      (patch.lat !== undefined && patch.lat !== existing.lat) ||
      (patch.lng !== undefined && patch.lng !== existing.lng);

    if (coordinates_changed) {
      const lat = patch.lat ?? existing.lat;
      const lng = patch.lng ?? existing.lng;
      const resolved = await this.reverse_geocoding_port.resolve(lat, lng);
      patch.address = resolved
        ? formatAddressText(resolved.formatted_lines)
        : null;
      patch.address_details = resolved;
    }

    const has_vehicle_updates = Object.keys(patch).length > 0;
    let updated = existing_primitive;

    if (has_vehicle_updates) {
      updated = applyVehicleUpdates(existing_primitive, patch);
      const version = await this.catalog_versions_service.findById(
        updated.version_id,
      );
      if (!version) {
        throw new InvalidateVehicleVersionIdException();
      }

      const fuel_type = await this.catalog_fuel_types_service.findById(
        version.fuel_type_id,
      );
      if (!fuel_type) {
        throw new CatalogFuelTypeNotFoundException(version.fuel_type_id);
      }

      updated.suggestions = validateVehicleCreationRules({
        battery_capacity: updated.battery_capacity,
        time_to_charge: updated.time_to_charge,
        autonomy: updated.autonomy,
        displacement: updated.displacement,
        mileage: updated.mileage,
        condition: updated.condition,
        can_charge: fuel_type.can_charge,
      });

      await this.vehicle_repository.update(updated);
    }

    if (price !== undefined || vehicle_price_id !== undefined) {
      await this.set_vehicle_price_service.execute({
        vehicle_id: id,
        price,
        vehicle_price_id,
      });
    }

    if (images && images.length > 0) {
      await this.attach_vehicle_images_from_temp_service.execute({
        vehicle_id: id,
        images: images,
      });
    }

    if (videos && videos.length > 0) {
      await this.replaceVehicleVideosFromTemp(id, videos);
    }

    const has_non_price_updates =
      has_vehicle_updates ||
      (images !== undefined && images.length > 0) ||
      (videos !== undefined && videos.length > 0);

    if (
      has_non_price_updates &&
      price === undefined &&
      vehicle_price_id === undefined &&
      existing.status === STATUS_VEHICLE.ACTIVE
    ) {
      await this.alert_processing_enqueue_service.enqueue_vehicle_event({
        vehicle_id: id,
        event_type: ALERT_EVENT_TYPE.RECENTLY_UPDATED,
      });
    }

    const has_any_updates =
      has_non_price_updates ||
      price !== undefined ||
      vehicle_price_id !== undefined;
    if (has_any_updates) {
      await this.vehicle_search_indexer.indexVehicle(id);
    }

    return { vehicle: updated };
  }

  private async replaceVehicleVideosFromTemp(
    vehicle_id: string,
    videos: NonNullable<UpdateVehicleDto["videos"]>,
  ): Promise<void> {
    const ordered_videos = [...videos].sort((a, b) => a.order - b.order);
    const temp_paths = ordered_videos.map((video) => video.path);
    const { pathnames } =
      await this.promote_temp_storage_paths_service.execute({
        paths: temp_paths,
      });

    if (pathnames.length !== ordered_videos.length) {
      const promotion_error = new Error(
        "No se pudieron promover todos los videos del vehículo",
      );
      try {
        await this.promote_temp_storage_paths_service.rollback({
          paths: temp_paths,
        });
      } catch (rollback_error) {
        throw new AggregateError(
          [promotion_error, rollback_error],
          "La promoción de videos quedó incompleta y su rollback falló",
        );
      }
      throw promotion_error;
    }

    try {
      await this.videos_repository.manager.transaction(async (manager) => {
        await manager.delete(VideosEntity, { vehicle_id });
        await manager.save(
          VideosEntity,
          ordered_videos.map((video, index) =>
            manager.create(VideosEntity, {
              vehicle_id,
              url: pathnames[index],
              order: video.order,
              status: "active",
            }),
          ),
        );
      });
    } catch (error) {
      try {
        await this.promote_temp_storage_paths_service.rollback({
          paths: temp_paths,
        });
      } catch (rollback_error) {
        throw new AggregateError(
          [error, rollback_error],
          "Falló la actualización de videos y también su rollback",
        );
      }
      throw error;
    }
  }

  async remove(remove_vehicle_dto: RemoveVehicleDto): Promise<void> {
    const existing = await this.vehicle_repository.findOne(remove_vehicle_dto.id);
    if (!existing) {
      throw new VehicleNotFoundException(remove_vehicle_dto.id);
    }

    await this.vehicle_image_repository.remove_storage_for_vehicle(
      remove_vehicle_dto.id,
    );
    await this.vehicle_repository.remove(remove_vehicle_dto.id);
    await this.vehicle_search_indexer.deleteVehicle(remove_vehicle_dto.id);
  }

  async findOwnerVehicles(
    dto: FindOwnerVehiclesDto,
  ): Promise<PaginatedResult<OwnerVehicleListItem>> {
    const filter = new OwnerVehicleFilter({
      profile_id: dto.profile_id,
      status: dto.status,
      make_id: dto.make_id,
      model_id: dto.model_id,
      since_created_at: dto.since_created_at,
      until_created_at: dto.until_created_at,
      page: dto.page ?? 1,
      limit: dto.limit ?? 10,
      order_by: dto.order_by,
      order_direction: dto.order_direction,
    });

    return this.vehicle_repository.findAllByProfileId(filter);
  }

  async getVehicleReport(dto: GetVehicleReportDto): Promise<VehicleReport> {
    const report = await this.vehicle_repository.findReportByIdAndProfileId(
      dto.vehicle_id,
      dto.profile_id,
    );
    if (!report) {
      throw new VehicleNotFoundException(dto.vehicle_id);
    }
    return report;
  }

  async duplicate(dto: DuplicateVehicleDto): Promise<{ vehicle_id: string }> {
    const vehicle_id = await this.vehicle_repository.duplicate(dto.vehicle_id);
    await this.vehicle_search_indexer.syncVehicle(
      vehicle_id,
      STATUS_VEHICLE.PENDING,
    );
    return { vehicle_id };
  }

  async renew(dto: RenewVehicleDto) {
    const existing = await this.vehicle_repository.findById(dto.vehicle_id);
    if (!existing) {
      throw new VehicleNotFoundException(dto.vehicle_id);
    }

    const primitive = existing;
    const now = new Date();

    if (
      !canRenewVehicle({
        status: primitive.status ?? STATUS_VEHICLE.PENDING,
        renewed_at: primitive.renewed_at ?? null,
        now,
      })
    ) {
      throw new BadRequestException(
        "Este anuncio no cumple las condiciones para renovarse",
      );
    }

    const updated = applyVehicleUpdates(primitive, {
      renewed_at: now,
      expires_at: computeRenewedExpiresAt(primitive.expires_at ?? now, now),
    });

    await this.vehicle_repository.update(updated);

    const renewed = updated;
    if (renewed.expires_at) {
      await this.vehicle_listing_expiry_scheduler.scheduleForVehicle(
        dto.vehicle_id,
        renewed.expires_at,
        now,
      );
    }

    await this.vehicle_search_indexer.syncVehicle(
      dto.vehicle_id,
      primitive.status,
    );

    return {
      renewed_at: now,
      expires_at: renewed.expires_at,
      can_renew: false,
    };
  }

  async feature(dto: FeatureVehicleDto) {
    const existing = await this.vehicle_repository.findById(dto.vehicle_id);
    if (!existing) {
      throw new VehicleNotFoundException(dto.vehicle_id);
    }

    const is_featured_active = isFeaturedActive({
      is_featured: existing.is_featured ?? false,
      featured_expires_at: existing.featured_expires_at ?? null,
    });

    if (
      !canFeatureVehicle({
        status: existing.status ?? STATUS_VEHICLE.PENDING,
        is_featured_active,
      })
    ) {
      throw new BadRequestException(
        "Este anuncio no se puede destacar. Debe estar activo y no estar destacado.",
      );
    }

    if (!existing.profile_id) {
      throw new BadRequestException(
        "Este anuncio no tiene un propietario asociado.",
      );
    }

    await this.entitlements_service.assertCanFeatureListing(existing.profile_id);

    const preloaded = await this.vehicleRepository.preload({
      id: dto.vehicle_id,
      is_featured: true,
      featured_expires_at: null,
    });
    if (!preloaded) {
      throw new VehicleNotFoundException(dto.vehicle_id);
    }

    await this.vehicleRepository.save(preloaded);
    await this.vehicle_search_indexer.syncVehicle(
      dto.vehicle_id,
      preloaded.status,
    );

    return {
      is_featured: true,
      featured_expires_at: null,
      can_feature: false,
    };
  }

  async schedule(dto: ScheduleVehicleDto) {
    const existing = await this.vehicle_repository.findById(dto.vehicle_id);
    if (!existing) {
      throw new VehicleNotFoundException(dto.vehicle_id);
    }

    const primitive = existing;
    const now = new Date();
    const scheduled_at = dto.scheduled_publish_at;

    if (scheduled_at.getTime() <= now.getTime()) {
      throw new BadRequestException("La fecha de publicación debe ser futura");
    }

    if (scheduled_at.getTime() > now.getTime() + SCHEDULE_MAX_FUTURE_MS) {
      throw new BadRequestException(
        "La fecha de publicación no puede superar los 90 días",
      );
    }

    if (!canScheduleVehicle(primitive.status ?? STATUS_VEHICLE.PENDING)) {
      throw new BadRequestException(
        "Este anuncio no se puede programar en su estado actual",
      );
    }

    const updated = applyVehicleUpdates(primitive, {
      scheduled_publish_at: scheduled_at,
      status: STATUS_VEHICLE.INACTIVE,
    });

    await this.vehicle_repository.update(updated);
    await this.vehicle_search_indexer.syncVehicle(
      dto.vehicle_id,
      STATUS_VEHICLE.INACTIVE,
    );

    return {
      scheduled_publish_at: scheduled_at,
      status: STATUS_VEHICLE.INACTIVE,
    };
  }

  async updateOwnerStatus(dto: UpdateOwnerVehicleStatusDto) {
    const existing = await this.vehicle_repository.findById(dto.vehicle_id);
    if (!existing) {
      throw new VehicleNotFoundException(dto.vehicle_id);
    }

    const vehicle = existing;
    await this.vehicleRepository.update(vehicle.id, { status: dto.status });
    await this.alert_processing_enqueue_service.enqueue_vehicle_event({
      vehicle_id: dto.vehicle_id,
      event_type: ALERT_EVENT_TYPE.NEW_LISTING,
    });
    await this.vehicle_search_indexer.syncVehicle(
      dto.vehicle_id,
      STATUS_VEHICLE.ACTIVE,
    );

    return { status: STATUS_VEHICLE.ACTIVE };
  }

  async processScheduledPublish(): Promise<{ processed: number }> {
    const now = new Date();
    const vehicles = await this.vehicle_repository.findScheduledForPublish(now);
    let processed = 0;

    for (const vehicle of vehicles) {
      const primitive = vehicle;
      const profile_id = primitive.profile_id;
      if (!profile_id) {
        continue;
      }

      const has_approved_before =
        await this.vehicle_repository.profileHasApprovedAdsBefore(
          profile_id,
          primitive.id,
        );

      const next_status = has_approved_before
        ? STATUS_VEHICLE.ACTIVE
        : STATUS_VEHICLE.PENDING;

      const updated = applyVehicleUpdates(vehicle, {
        status: next_status,
        scheduled_publish_at: null,
        status_change_message: null,
      });

      await this.vehicle_repository.update(updated);

      if (next_status === STATUS_VEHICLE.ACTIVE) {
        await this.alert_processing_enqueue_service.enqueue_vehicle_event({
          vehicle_id: primitive.id,
          event_type: ALERT_EVENT_TYPE.NEW_LISTING,
        });
      }

      await this.vehicle_search_indexer.syncVehicle(primitive.id, next_status);
      processed += 1;
    }

    return { processed };
  }

  async expireFeatured(): Promise<{ processed: number }> {
    const now = new Date();
    const vehicles = await this.vehicle_repository.findExpiredFeatured(now);
    let processed = 0;

    for (const vehicle of vehicles) {
      const primitive = vehicle;
      const updated = applyVehicleUpdates(primitive, {
        is_featured: false,
        featured_expires_at: null,
        featured_boost_weight: null,
      });

      await this.vehicle_repository.update(updated);
      await this.vehicle_search_indexer.syncVehicle(
        primitive.id,
        primitive.status,
      );

      const detail = await this.vehicle_repository.findOne(primitive.id);
      const vehicle_title = detail
        ? formatVehicleDisplayName({
          make_name: detail.version.make.name,
          model_name: detail.version.model.name,
          version_name: detail.version.name,
        })
        : "tu anuncio";

      if (primitive.profile_id) {
        await this.billing_notification_mail_service.enqueueFeaturedExpired({
          profile_id: primitive.profile_id,
          vehicle_id: primitive.id,
          vehicle_title,
        });
      }

      processed += 1;
    }

    return { processed };
  }

  async findSimilar(
    dto: FindSimilarVehiclesDto,
  ): Promise<FindSimilarVehiclesResult> {
    const reference = await this.vehicle_repository.findOne(dto.vehicle_id);
    if (!reference) {
      throw new VehicleNotFoundException(dto.vehicle_id);
    }

    const catalog = await this.resolveSimilarCatalog(reference.version_id);
    const listing_href_slugs: FindSimilarVehiclesListingHrefSlugs = {
      make: catalog.make_slug,
      model: catalog.model_slug,
    };

    const tier1_filter = this.buildSimilarTierFilter({
      reference,
      catalog,
      tier: 1,
      page: dto.page ?? 1,
      limit: dto.limit ?? 10,
    });

    const tier1_result = await this.vehicle_repository.findAll(tier1_filter);
    if (tier1_result.total > 0) {
      return {
        ...tier1_result,
        tier: 1,
        listing_href_slugs,
      };
    }

    const tier2_filter = this.buildSimilarTierFilter({
      reference,
      catalog,
      tier: 2,
      page: dto.page ?? 1,
      limit: dto.limit ?? 10,
    });
    const tier2_result = await this.vehicle_repository.findAll(tier2_filter);

    return {
      ...tier2_result,
      tier: 2,
      listing_href_slugs,
    };
  }

  async adminFindAll(
    dto: AdminFindAllVehiclesDto,
  ): Promise<PaginatedResult<AdminVehicleListItem>> {
    const filter = new AdminVehicleFilter({ ...dto });
    return this.vehicle_repository.adminFindAll(filter);
  }

  async adminFindOne(
    dto: AdminGetVehicleDto,
  ): Promise<{ vehicle: AdminVehicleDetail }> {
    const vehicle = await this.vehicle_repository.adminFindOne(dto.id);
    if (!vehicle) {
      throw new VehicleNotFoundException(dto.id);
    }
    return { vehicle };
  }

  async adminUpdateStatus(dto: AdminUpdateVehicleStatusDto) {
    const existing = await this.vehicle_repository.findOne(dto.vehicle_id);
    if (!existing) {
      throw new VehicleNotFoundException(dto.vehicle_id);
    }

    const previous_status = existing.status;
    const new_status = dto.status;

    if (previous_status === new_status) {
      return { vehicle: vehicleDetailToPrimitives(existing) };
    }

    const status_change_message =
      new_status === STATUS_VEHICLE.ACTIVE
        ? null
        : dto.message?.trim() ?? null;

    const updated = applyVehicleUpdates(
      vehicleDetailToPrimitives(existing),
      {
      status: new_status,
      status_change_message,
      },
    );

    await this.vehicle_repository.update(updated);

    const publisher_email = existing.profile_id
      ? await this.profile_user_repository.findEmailById(existing.profile_id)
      : null;

    if (publisher_email) {
      await this.enqueueThematicStatusMail({
        to: publisher_email,
        detail: existing,
        new_status,
        status_change_message,
      });
    }

    if (new_status === STATUS_VEHICLE.ACTIVE) {
      await this.alert_processing_enqueue_service.enqueue_vehicle_event({
        vehicle_id: dto.vehicle_id,
        event_type: ALERT_EVENT_TYPE.NEW_LISTING,
      });

      const updated_primitive = updated;
      if (updated_primitive.is_featured) {
        await this.alert_processing_enqueue_service.enqueue_vehicle_event({
          vehicle_id: dto.vehicle_id,
          event_type: ALERT_EVENT_TYPE.FEATURED,
        });
      }
    }

    if (
      new_status === STATUS_VEHICLE.SOLD ||
      new_status === STATUS_VEHICLE.ARCHIVED ||
      new_status === STATUS_VEHICLE.INACTIVE
    ) {
      await this.alert_processing_enqueue_service.enqueue_vehicle_event({
        vehicle_id: dto.vehicle_id,
        event_type: ALERT_EVENT_TYPE.SOLD_REMOVED,
      });
    }

    await this.vehicle_search_indexer.syncVehicle(dto.vehicle_id, new_status);

    return { vehicle: updated };
  }

  private async resolveSimilarCatalog(
    version_id: number,
  ): Promise<ResolvedVehicleCatalog> {
    const version = await this.catalog_versions_service.findById(version_id);
    if (!version) {
      throw new InvalidateVehicleVersionIdException();
    }

    const [make, model, year_row, fuel_type] = await Promise.all([
      this.makes_service.findById(version.make_id),
      this.catalog_models_service.findById(version.model_id),
      this.catalog_years_service.findById(version.year_id),
      this.catalog_fuel_types_service.findById(version.fuel_type_id)]);

    if (!make || !model || !year_row || !fuel_type) {
      throw new InvalidateVehicleVersionIdException();
    }

    return {
      make_slug: make.slug,
      model_slug: model.slug,
      year: year_row.year,
      fuel_type_slug: fuel_type.slug,
    };
  }

  private buildSimilarTierFilter(input: {
    reference: {
      id: string;
      mileage: number;
      lat: number;
      lng: number;
      condition: string;
      transmission_type: TransmissionType;
    };
    catalog: ResolvedVehicleCatalog;
    tier: SimilarVehiclesTier;
    page: number;
    limit: number;
  }): VehicleFilter {
    const { reference, catalog, tier, page, limit } = input;
    const year_delta = tier === 1 ? TIER1_YEAR_DELTA : TIER2_YEAR_DELTA;
    const mileage_delta = Math.round(
      reference.mileage * MILEAGE_TOLERANCE_RATIO,
    );

    const base = {
      page,
      limit,
      order_by: "created_at",
      order_direction: "DESC" as const,
      status: STATUS_VEHICLE.ACTIVE,
      exclude_vehicle_ids: [reference.id],
      condition: reference.condition as ConditionVehicle,
      makes_slugs: [catalog.make_slug],
    };

    if (tier === 1) {
      return new VehicleFilter({
        ...base,
        models_slugs: [catalog.model_slug],
        since_year: catalog.year - year_delta,
        until_year: catalog.year + year_delta,
        since_mileage: Math.max(0, reference.mileage - mileage_delta),
        until_mileage: reference.mileage + mileage_delta,
        transmission_types: [reference.transmission_type],
        fuel_type_slugs: [catalog.fuel_type_slug],
        lat: reference.lat,
        lng: reference.lng,
        radius: SIMILAR_RADIUS_METERS,
      });
    }

    return new VehicleFilter({
      ...base,
      since_year: catalog.year - year_delta,
      until_year: catalog.year + year_delta,
    });
  }

  private async enqueueThematicStatusMail(params: {
    to: string;
    detail: VehicleDetail;
    new_status: StatusVehicle;
    status_change_message: string | null;
  }): Promise<void> {
    const vehicle = this.buildMailCardFromDetail(params.detail);
    const payload = {
      to: params.to,
      vehicle,
      status_change_message: params.status_change_message,
    };

    if (params.new_status === STATUS_VEHICLE.ACTIVE) {
      await this.outbound_mail_enqueue_service.enqueue_vehicle_approved(payload);
      return;
    }

    if (params.new_status === STATUS_VEHICLE.INACTIVE) {
      if (params.status_change_message) {
        await this.outbound_mail_enqueue_service.enqueue_vehicle_rejected(
          payload,
        );
        return;
      }
      await this.outbound_mail_enqueue_service.enqueue_vehicle_deactivated(
        payload,
      );
      return;
    }

    if (params.new_status === STATUS_VEHICLE.SOLD) {
      await this.outbound_mail_enqueue_service.enqueue_vehicle_sold(payload);
      return;
    }

    if (params.new_status === STATUS_VEHICLE.ARCHIVED) {
      await this.outbound_mail_enqueue_service.enqueue_vehicle_archived(payload);
      return;
    }

    await this.outbound_mail_enqueue_service.enqueue_vehicle_published(payload);
  }

  private buildMailCardFromDetail(detail: VehicleDetail): MailVehicleCardPayload {
    const title = formatVehicleDisplayName({
      make_name: detail.version.make.name,
      model_name: detail.version.model.name,
      version_name: detail.version.name,
    });

    return buildMailVehicleCard({
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
    });
  }
}
