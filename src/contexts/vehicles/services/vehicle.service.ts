import { BadRequestException } from "@nestjs/common";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { is_temp_storage_path } from "@/src/contexts/shared/file/types/temp-storage-path";
import { OutboundMailEnqueueService } from "@/src/contexts/shared/mail/outbound-mail-enqueue.service";
import { AlertProcessingEnqueueService } from "@/src/contexts/alerts/queues/alert-processing-enqueue.service";
import { ALERT_EVENT_TYPE } from "@/src/contexts/alerts/types/alert-event-type.enum";
import { TypeOrmProfileUserRepository } from "@/src/contexts/profiles/repositories/typeorm.profile-user-repository";

import { CatalogFuelTypeNotFoundException } from "../catalog/fuel_types/exceptions/catalog-fuel-type-not-found.exception";
import { FuelIncompatibilitiesException } from "../catalog/fuel_types/exceptions/fuel_incompatibilities.exception";
import { CatalogFuelTypesService } from "../catalog/fuel_types/services/catalog-fuel-types.service";
import { CatalogModelsService } from "../catalog/models/services/catalog-models.service";
import { MakesService } from "../catalog/makes/services/makes.service";
import { CatalogVersionsService } from "../catalog/versions/services/catalog-versions.service";
import { CatalogYearsService } from "../catalog/years/services/catalog-years.service";
import {
  CONDITION_VEHICLE,
  ConditionVehicle,
  PUBLISHER_TYPE,
  PrimitiveVehicle,
  STATUS_VEHICLE,
  StatusVehicle,
  TransmissionType,
  Vehicle,
  VehicleUpdateFields,
} from "../types/vehicle";
import { ElectricDisplacementException } from "../exceptions/electric-displacement.exception";
import { InvalidateVehicleVersionIdException } from "../exceptions/InvalidateVehicleVersionId.exception";
import { NewVehicleMileageException } from "../exceptions/newVehicleMilleage.exception";
import { VehicleNotFoundException } from "../exceptions/vehicle-not-found.exception";
import { AdminVehicleFilter } from "../types/admin-vehicle.filter";
import { OwnerVehicleFilter } from "../types/owner-vehicle.filter";
import { VehicleFilter } from "../types/vehicle.filter";
import { AdminVehicleDetail } from "../types/admin-vehicle-detail";
import {
  vehicleDetailToPrimitives,
  VehicleDetail,
} from "../types/vehicle-detail";
import { OwnerVehicleListItem } from "../types/owner-vehicle-list-item";
import {
  AdminVehicleListItem,
  VehicleListItem,
} from "../types/vehicle-list-item";
import { formatVehicleDisplayName } from "../utils/format-vehicle-display-name";
import {
  canOwnerReactivate,
  canRenewVehicle,
  canScheduleVehicle,
  SCHEDULE_MAX_FUTURE_MS,
} from "../utils/owner-vehicle-rules";
import { AdminFindAllVehiclesDto } from "../dto/admin-find-all-vehicles.dto";
import { AdminGetVehicleDto } from "../dto/admin-get-vehicle.dto";
import { AdminUpdateVehicleStatusDto } from "../dto/admin-update-vehicle-status.dto";
import { CreateVehicleDto } from "../dto/create-vehicle.dto";
import { DuplicateVehicleDto } from "../dto/duplicate-vehicle.dto";
import { FindAllVehiclesUseCaseDto } from "../dto/find-all-vehicles.dto";
import { FindOwnerVehiclesDto } from "../dto/find-owner-vehicles.dto";
import { FindSimilarVehiclesDto } from "../dto/find-similar-vehicles.dto";
import { GetVehicleDto } from "../dto/get-vehicle.dto";
import { RemoveVehicleDto } from "../dto/remove-vehicle.dto";
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
import { TypeOrmVehiclePriceRepository } from "@/src/contexts/vehicles/vehicle-prices/repositories/typeorm.vehicle-price.repository";

export interface ValidateVehicleInput {
  battery_capacity: number;
  time_to_charge: number;
  autonomy: number;
  version_id: number;
  displacement: number;
  mileage: number;
  condition: ConditionVehicle;
}

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

const STATUS_LABELS: Record<StatusVehicle, string> = {
  active: "Activo",
  pending: "Pendiente",
  inactive: "Inactivo",
  sold: "Vendido",
  archived: "Archivado",
};

@Injectable()
export class VehicleService {
  private readonly MAX_MILEAGE_FOR_NEW_VEHICLE = 1000;

  constructor(
    private readonly vehicle_repository: TypeOrmVehicleRepository,
    private readonly attach_vehicle_images_from_temp_service: AttachVehicleImagesFromTempService,
    private readonly set_vehicle_price_service: SetVehiclePriceService,
    private readonly vehicle_price_repository: TypeOrmVehiclePriceRepository,
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
  ) {}

  async create(
    create_vehicle_dto: CreateVehicleDto,
    publisher_profile_id: string,
  ): Promise<{ vehicle: PrimitiveVehicle }> {
    const { battery_capacity, time_to_charge, autonomy } = create_vehicle_dto;
    const displacement = create_vehicle_dto.displacement;
    const { suggestions } = await this.validate({
      battery_capacity: battery_capacity ?? 0,
      time_to_charge: time_to_charge ?? 0,
      autonomy: autonomy ?? 0,
      version_id: create_vehicle_dto.version_id,
      displacement,
      mileage: create_vehicle_dto.mileage,
      condition: create_vehicle_dto.condition,
    });
    const resolved = await this.reverse_geocoding_port.resolve(
      create_vehicle_dto.lat,
      create_vehicle_dto.lng,
    );

    const vehicle = Vehicle.create({
      vin_code: create_vehicle_dto.vin_code ?? "",
      profile_id: publisher_profile_id,
      mileage: create_vehicle_dto.mileage,
      lat: create_vehicle_dto.lat,
      lng: create_vehicle_dto.lng,
      condition: create_vehicle_dto.condition,
      description: create_vehicle_dto.description.trim(),
      version_id: create_vehicle_dto.version_id,
      publisher_type:
        create_vehicle_dto.publisher_type ?? PUBLISHER_TYPE.PARTICULAR,
      transmission_type: create_vehicle_dto.transmission_type,
      traction_id: create_vehicle_dto.traction_id,
      power: create_vehicle_dto.power,
      displacement,
      autonomy: create_vehicle_dto.autonomy ?? 0,
      battery_capacity: create_vehicle_dto.battery_capacity ?? 0,
      time_to_charge: create_vehicle_dto.time_to_charge ?? 0,
      license_plate: create_vehicle_dto.license_plate ?? "",
      phone_code: create_vehicle_dto.phone_code,
      phone: create_vehicle_dto.phone,
      has_whatsapp: create_vehicle_dto.has_whatsapp ?? false,
      show_phone: create_vehicle_dto.show_phone ?? true,
      email: create_vehicle_dto.email,
      features_ids: create_vehicle_dto.features_ids ?? [],
      services_ids: create_vehicle_dto.services_ids ?? [],
      vehicle_type_id: create_vehicle_dto.vehicle_type_id ?? null,
      category_id: create_vehicle_dto.category_id ?? null,
      color_id: create_vehicle_dto.color_id ?? null,
      dgt_label_id: create_vehicle_dto.dgt_label_id ?? null,
      warranty_type_id: create_vehicle_dto.warranty_type_id ?? null,
      cuota_ids: create_vehicle_dto.cuota_ids ?? [],
      suggestions,
      address: resolved ? formatAddressText(resolved.formatted_lines) : null,
      address_details: resolved,
    });
    await this.vehicle_repository.save(vehicle);

    await this.set_vehicle_price_service.execute({
      vehicle_id: vehicle.toPrimitives().id,
      price: create_vehicle_dto.price,
    });

    if (create_vehicle_dto.images && create_vehicle_dto.images.length > 0) {
      await this.attach_vehicle_images_from_temp_service.execute({
        vehicle_id: vehicle.toPrimitives().id,
        images: create_vehicle_dto.images,
      });
    }

    await this.vehicle_search_indexer.syncVehicle(
      vehicle.toPrimitives().id,
      STATUS_VEHICLE.PENDING,
    );

    return { vehicle: vehicle.toPrimitives() };
  }

  async findOne(get_vehicle_dto: GetVehicleDto): Promise<VehicleDetail> {
    const vehicle = await this.vehicle_repository.findOne(get_vehicle_dto.id);
    if (!vehicle) {
      throw new VehicleNotFoundException(get_vehicle_dto.id);
    }
    return vehicle;
  }

  async findAll(
    find_all_vehicles_dto: FindAllVehiclesUseCaseDto,
  ): Promise<PaginatedResult<VehicleListItemDto>> {
    const filter = new VehicleFilter({ ...find_all_vehicles_dto });
    return this.vehicle_repository.findAll(filter);
  }

  async update(update_vehicle_dto: UpdateVehicleDto) {
    const existing = await this.vehicle_repository.findOne(update_vehicle_dto.id);
    if (!existing) {
      throw new VehicleNotFoundException(update_vehicle_dto.id);
    }

    const { id, images, price, vehicle_price_id, ...dto_fields } =
      update_vehicle_dto;

    const patch = Object.fromEntries(
      Object.entries(dto_fields as Record<string, unknown>).filter(
        ([ value]) => value !== undefined,
      ),
    ) as VehicleUpdateFields;

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

    const updated = Vehicle.fromPrimitives(
      vehicleDetailToPrimitives(existing),
    ).applyUpdates(patch);
    await this.vehicle_repository.update(updated);

    if (price !== undefined || vehicle_price_id !== undefined) {
      const previous_active =
        await this.vehicle_price_repository.findActiveByVehicleId(id);
      const previous_price = previous_active?.toPrimitives().price;

      await this.set_vehicle_price_service.execute({
        vehicle_id: id,
        price,
        vehicle_price_id,
      });

      if (
        price !== undefined &&
        previous_price !== undefined &&
        price < previous_price &&
        existing.status === STATUS_VEHICLE.ACTIVE
      ) {
        await this.alert_processing_enqueue_service.enqueue_vehicle_event({
          vehicle_id: id,
          event_type: ALERT_EVENT_TYPE.PRICE_DROP,
          metadata: {
            previous_price,
            vehicle_price: price,
          },
        });
      }
    }

    if (images && images.length > 0) {
      const temp_images = images.filter((image) =>
        is_temp_storage_path(image.path),
      );
      if (temp_images.length > 0) {
        await this.attach_vehicle_images_from_temp_service.execute({
          vehicle_id: id,
          images: temp_images,
        });
      }
    }

    const has_non_price_updates =
      Object.keys(patch).length > 0 ||
      (images !== undefined && images.length > 0);

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

    await this.vehicle_search_indexer.indexVehicle(id);

    return { vehicle: updated.toPrimitives() };
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
      page: dto.page ?? 1,
      limit: dto.limit ?? 10,
      order_by: dto.order_by,
      order_direction: dto.order_direction,
    });

    return this.vehicle_repository.findAllByProfileId(filter);
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

    const primitive = existing.toPrimitives();
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

    const updated = Vehicle.fromPrimitives(primitive).applyUpdates({
      renewed_at: now,
    });

    await this.vehicle_repository.update(updated);
    await this.vehicle_search_indexer.syncVehicle(
      dto.vehicle_id,
      primitive.status,
    );

    return {
      renewed_at: now,
      can_renew: false,
    };
  }

  async schedule(dto: ScheduleVehicleDto) {
    const existing = await this.vehicle_repository.findById(dto.vehicle_id);
    if (!existing) {
      throw new VehicleNotFoundException(dto.vehicle_id);
    }

    const primitive = existing.toPrimitives();
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

    const updated = Vehicle.fromPrimitives(primitive).applyUpdates({
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

    const primitive = existing.toPrimitives();
    const current_status = primitive.status ?? STATUS_VEHICLE.PENDING;

    if (current_status === dto.status) {
      return { status: current_status };
    }

    if (dto.status === STATUS_VEHICLE.INACTIVE) {
      if (current_status !== STATUS_VEHICLE.ACTIVE) {
        throw new BadRequestException("Solo puedes pausar anuncios activos");
      }

      const updated = Vehicle.fromPrimitives(primitive).applyUpdates({
        status: STATUS_VEHICLE.INACTIVE,
        status_change_message: null,
      });
      await this.vehicle_repository.update(updated);
      await this.alert_processing_enqueue_service.enqueue_vehicle_event({
        vehicle_id: dto.vehicle_id,
        event_type: ALERT_EVENT_TYPE.SOLD_REMOVED,
      });
      await this.vehicle_search_indexer.syncVehicle(
        dto.vehicle_id,
        STATUS_VEHICLE.INACTIVE,
      );
      return { status: STATUS_VEHICLE.INACTIVE };
    }

    if (current_status !== STATUS_VEHICLE.INACTIVE) {
      throw new BadRequestException(
        "Solo puedes reactivar anuncios inactivos",
      );
    }

    if (
      !canOwnerReactivate({
        status: current_status,
        status_change_message: primitive.status_change_message ?? null,
        scheduled_publish_at: primitive.scheduled_publish_at ?? null,
      })
    ) {
      throw new BadRequestException(
        "Este anuncio no se puede reactivar desde aquí",
      );
    }

    const updated = Vehicle.fromPrimitives(primitive).applyUpdates({
      status: STATUS_VEHICLE.ACTIVE,
      status_change_message: null,
    });
    await this.vehicle_repository.update(updated);
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
      const primitive = vehicle.toPrimitives();
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

      const updated = vehicle.applyUpdates({
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
      const primitive = vehicle.toPrimitives();
      const updated = Vehicle.fromPrimitives(primitive).applyUpdates({
        is_featured: false,
        featured_expires_at: null,
      });

      await this.vehicle_repository.update(updated);
      await this.vehicle_search_indexer.syncVehicle(
        primitive.id,
        primitive.status,
      );
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

    const updated = Vehicle.fromPrimitives(
      vehicleDetailToPrimitives(existing),
    ).applyUpdates({
      status: new_status,
      status_change_message,
    });

    await this.vehicle_repository.update(updated);

    const publisher_email = existing.profile_id
      ? await this.profile_user_repository.findEmailById(existing.profile_id)
      : null;

    if (publisher_email) {
      await this.outbound_mail_enqueue_service.enqueue_vehicle_status_changed({
        to: publisher_email,
        vehicle_title: formatVehicleDisplayName({
          make_name: existing.version.make.name,
          model_name: existing.version.model.name,
          version_name: existing.version.name,
        }),
        previous_status_label: STATUS_LABELS[previous_status],
        new_status_label: STATUS_LABELS[new_status],
        status_change_message,
      });
    }

    if (new_status === STATUS_VEHICLE.ACTIVE) {
      await this.alert_processing_enqueue_service.enqueue_vehicle_event({
        vehicle_id: dto.vehicle_id,
        event_type: ALERT_EVENT_TYPE.NEW_LISTING,
      });

      const updated_primitive = updated.toPrimitives();
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

    return { vehicle: updated.toPrimitives() };
  }

  async validate(
    input: ValidateVehicleInput,
  ): Promise<{ suggestions: string[] }> {
    const suggestions: string[] = [];
    const {
      battery_capacity,
      time_to_charge,
      autonomy,
      version_id,
      displacement,
      mileage,
      condition,
    } = input;

    if (!Number.isInteger(version_id) || version_id < 1) {
      throw new InvalidateVehicleVersionIdException();
    }

    const version = await this.catalog_versions_service.findById(version_id);
    if (!version) {
      throw new InvalidateVehicleVersionIdException();
    }

    const fuel_type_id = version.fuel_type_id;
    const fuel_type =
      await this.catalog_fuel_types_service.findById(fuel_type_id);
    if (!fuel_type) {
      throw new CatalogFuelTypeNotFoundException(fuel_type_id);
    }

    const can_charge = fuel_type.can_charge;

    if (
      !can_charge &&
      (battery_capacity > 0 || autonomy > 0 || time_to_charge > 0)
    ) {
      throw new FuelIncompatibilitiesException();
    }

    if (
      mileage > this.MAX_MILEAGE_FOR_NEW_VEHICLE &&
      condition === CONDITION_VEHICLE.NEW
    ) {
      throw new NewVehicleMileageException();
    }
    if (
      mileage < this.MAX_MILEAGE_FOR_NEW_VEHICLE &&
      condition === CONDITION_VEHICLE.USED
    ) {
      suggestions.push(
        "Tu vehículo tiene menos de 1000 km, podrías considerarlo como nuevo para obtener una mejor visibilidad en la plataforma.",
      );
    }

    if (can_charge && displacement > 0) {
      throw new ElectricDisplacementException();
    }

    return { suggestions };
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
}
