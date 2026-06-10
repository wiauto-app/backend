import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectRepository } from "@nestjs/typeorm";
import { DeepPartial, FindOptionsWhere, In, Repository } from "typeorm";

import { PrimitiveVehicle, Vehicle } from "../../domain/entities/vehicle";
import { InvalidVehicleFeatureIdsException } from "../../domain/exceptions/invalid-vehicle-feature-ids.exception";
import { InvalidVehicleServiceIdsException } from "../../domain/exceptions/invalid-vehicle-service-ids.exception";
import { InvalidVehicleCatalogIdException } from "../../domain/exceptions/invalid-vehicle-catalog-id.exception";
import { VehicleNotFoundException } from "../../domain/exceptions/vehicle-not-found.exception";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { VehicleFilter } from "../../domain/filters/vehicle.filter";
import {
  AdminVehicleListItem,
  VehicleListItem,
  VehicleListItemImage,
} from "../../domain/read-models/vehicle-list-item";
import type { VehicleImagesEntity } from "../../vehicle-images/infrastructure/persistence/vehicle-images.entity";
import { AdminVehicleDetail } from "../../domain/read-models/admin-vehicle-detail";
import { VehicleDetail } from "../../domain/read-models/vehicle-detail";
import { VehicleRepository } from "../../domain/repositories/vehicle.repository";
import { ColorEntity } from "../persistence/color.entity";
import { DgtLabelEntity } from "../persistence/dgt-label.entity";
import { FeaturesEntity } from "../persistence/features.entity";
import { ServiceEntity } from "../persistence/service.entity";
import { ProfileEntity } from "@/src/contexts/profiles/infrastructure/persistence/profile.entity";
import { VehicleEntity } from "../persistence/vehicle.entity";
import { VehicleTypeEntity } from "../persistence/vehicle-type.entity";
import { WarrantyTypeEntity } from "../persistence/warranty-type.entity";
import { TractionEntity } from "../persistence/traction.entity";
import { CuotaEntity } from "../persistence/cuota.entity";
import { CategoryEntity } from "../persistence/category.entity";
import { VehiclePriceEntity } from "../../vehicle-prices/infrastructure/persistence/vehicle-price.entity";
import { VEHICLE_PRICE_STATUS } from "../../vehicle-prices/domain/vehicle-price";
import { applyAdminFilters, applyFilters } from "../validators/filters.applier";
import { getSkip } from "@/src/contexts/shared/getSkip";
import { AdminVehicleFilter } from "../../domain/filters/admin-vehicle.filter";
import { MakeEntity } from "../../catalog/makes/infrastructure/persistence/make.entity";
import { CatalogModelEntity } from "../../catalog/models/infrastructure/persistence/catalog-model.entity";
import {
  MakeModelFilterMode,
  resolveMakeModelFilterMode,
} from "../validators/make-model-filter-mode.utils";
import { DealershipMembersEntity } from "@/src/contexts/dealership/infrastructure/persistence/dealership-members.entity";

const unique_string_ids = (ids: string[]): string[] => [...new Set(ids)];

const get_active_price = (entity: VehicleEntity): number => {
  const active = entity.vehicle_prices?.find(
    (item) => item.status === VEHICLE_PRICE_STATUS.ACTIVE,
  );
  return active?.price ?? 0;
};

const map_vehicle_prices_history = (
  vehicle_prices: VehiclePriceEntity[] | undefined,
) =>
  [...(vehicle_prices ?? [])]
    .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
    .map((item) => ({
      id: item.id,
      price: item.price,
      status: item.status,
      created_at: item.created_at,
    }));

const vehicle_catalog_relations = {
  features: true,
  images: true,
  traction: true,
  vehicle_type: true,
  category: true,
  color: true,
  dgt_label: true,
  warranty_type: true,
  cuotas: true,
  services: true,
  profile: true,
} as const;

const map_vehicle_list_images = (
  images: VehicleImagesEntity[] | undefined,
): VehicleListItemImage[] =>
  [...(images ?? [])]
    .sort((a, b) => a.created_at.getTime() - b.created_at.getTime())
    .map((image) => ({ id: image.id, url: image.url }));

function entity_to_list_item(entity: VehicleEntity): VehicleListItem {
  return {
    id: entity.id,
    price: get_active_price(entity),
    mileage: entity.mileage,
    lat: Number(entity.lat),
    lng: Number(entity.lng),
    condition: entity.condition,
    title: entity.title,
    created_at: entity.created_at,
    images: map_vehicle_list_images(entity.images),
    features: entity.features && entity.features.length > 0 ? (entity.features).map((feature) => ({
      id: feature.id,
      name: feature.name,
      slug: feature.slug,
    })) : [],
    services: entity.services && entity.services.length > 0 ? (entity.services).map((service) => ({
      id: service.id,
      name: service.name,
      slug: service.slug,
    })) : [],
    vehicle_type: entity.vehicle_type
      ? {
        id: entity.vehicle_type.id,
        name: entity.vehicle_type.name,
        slug: entity.vehicle_type.slug,
      }
      : null,
    category: entity.category
      ? {
        id: entity.category.id,
        name: entity.category.name,
        slug: entity.category.slug,
      }
      : null,
    color: entity.color
      ? {
        id: entity.color.id,
        name: entity.color.name,
        slug: entity.color.slug,
        hex_code: entity.color.hex_code,
      }
      : null,
    dgt_label: entity.dgt_label
      ? {
        id: entity.dgt_label.id,
        name: entity.dgt_label.name,
        code: entity.dgt_label.code,
        slug: entity.dgt_label.slug,
      }
      : null,
    warranty_type: entity.warranty_type
      ? {
        id: entity.warranty_type.id,
        name: entity.warranty_type.name,
        slug: entity.warranty_type.slug,
      }
      : null,
    cuotas:
      entity.cuotas.length > 0
        ? entity.cuotas.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          value: c.value,
        }))
        : [],
    publisher: {
      id: entity.profile.id,
      name: entity.profile.name,
      avatar_url: entity.profile.avatar_url ?? "",
    },
  };
}

const pathname_to_compound_path = (pathname: string): string =>
  pathname.trim().replace(/^\/+/, "");

function entity_to_admin_vehicle_detail(entity: VehicleEntity): AdminVehicleDetail {
  const base = entity_to_primitives(entity);
  const sorted_images = map_vehicle_list_images(entity.images);
  const active_price = get_active_price(entity);

  return {
    id: base.id,
    vin_code: base.vin_code ?? null,
    vehicle_type_id: base.vehicle_type_id,
    category_id: base.category_id,
    title: base.title,
    description: base.description,
    price: active_price,
    vehicle_prices: map_vehicle_prices_history(entity.vehicle_prices),
    mileage: base.mileage,
    condition: base.condition,
    lat: base.lat,
    lng: base.lng,
    version_id: base.version_id,
    version_catalog: {
      make_id: entity.version.make_id,
      model_id: entity.version.model_id,
      body_type_id: entity.version.body_type_id,
      fuel_type_id: entity.version.fuel_type_id,
      year_id: entity.version.year_id,
    },
    traction_id: base.traction_id,
    transmission_type: base.transmission_type,
    power: base.power,
    displacement: base.displacement,
    autonomy: base.autonomy,
    battery_capacity: base.battery_capacity,
    time_to_charge: base.time_to_charge,
    license_plate: base.license_plate,
    publisher_type: base.publisher_type,
    phone_code: base.phone_code,
    phone: base.phone,
    email: base.email,
    features_ids: base.features_ids,
    services_ids: base.services_ids,
    color_id: base.color_id,
    dgt_label_id: base.dgt_label_id,
    warranty_type_id: base.warranty_type_id,
    cuota_ids: base.cuota_ids,
    images: sorted_images.map((image, index) => ({
      path: pathname_to_compound_path(image.url),
      order: index,
    })),
  };
}

function entity_to_vehicle_detail(entity: VehicleEntity, dealership_members: DealershipMembersEntity[]): VehicleDetail {
  const base = entity_to_list_item(entity);
  const dealership = dealership_members.find((member) => member.profile_id === entity.profile.id)?.dealership;
  return {
    ...base,
    description: entity.description,
    publisher_type: entity.publisher_type,
    status: entity.status,
    status_change_message: entity.status_change_message ?? null,
    is_featured: entity.is_featured,
    expires_at: entity.expires_at,
    views: entity.views,
    favorites: entity.favorites,
    shares: entity.shares,
    updated_at: entity.updated_at,
    transmission_type: entity.transmission_type,
    power: entity.power,
    displacement: entity.displacement,
    autonomy: entity.autonomy,
    battery_capacity: entity.battery_capacity,
    time_to_charge: entity.time_to_charge,
    license_plate: entity.license_plate,
    vin_code: entity.vin_code,
    version_id: entity.version_id,
    traction: {
      id: entity.traction.id,
      name: entity.traction.name,
      slug: entity.traction.slug,
    },
    phone_code: entity.phone_code,
    phone: entity.phone,
    email: entity.email,
    profile_id: entity.profile.id,
    suggestions: entity.suggestions,
    prices: map_vehicle_prices_history(entity.vehicle_prices),
    dealership:{
      id: dealership?.id ?? "",
      name: dealership?.name ?? "",
      slug: dealership?.slug ?? "",
      avatar_url: dealership?.avatar_url ?? "",
      banner_url: dealership?.banner_url ?? "",
      description: dealership?.description ?? "",
      website_url: dealership?.website_url ?? "",
      email: dealership?.email ?? "",
      phone_code: dealership?.phone_code ?? "",
    }
  };
}

function entity_to_admin_list_item(entity: VehicleEntity): AdminVehicleListItem {
  return {
    ...entity_to_list_item(entity),
    status: entity.status,
    status_change_message: entity.status_change_message ?? null,
    publisher_type: entity.publisher_type,
    is_featured: entity.is_featured,
    expires_at: entity.expires_at,
    views: entity.views,
    favorites: entity.favorites,
    shares: entity.shares,
    updated_at: entity.updated_at,
    transmission_type: entity.transmission_type,
    power: entity.power,
    displacement: entity.displacement,
    license_plate: entity.license_plate,
    autonomy: entity.autonomy,
    battery_capacity: entity.battery_capacity,
    time_to_charge: entity.time_to_charge,
    phone_code: entity.phone_code,
    phone: entity.phone,
    email: entity.email,
    version_id: entity.version_id,
    traction: {
      id: entity.traction.id,
      name: entity.traction.name,
      slug: entity.traction.slug,
    },
  };
}

function entity_to_primitives(entity: VehicleEntity): PrimitiveVehicle {
  return {
    id: entity.id,
    mileage: entity.mileage,
    lat: Number(entity.lat),
    lng: Number(entity.lng),
    condition: entity.condition,
    title: entity.title,
    description: entity.description,
    version_id: entity.version_id,
    status: entity.status,
    status_change_message: entity.status_change_message ?? null,
    is_featured: entity.is_featured,
    expires_at: entity.expires_at,
    views: entity.views,
    favorites: entity.favorites,
    shares: entity.shares,
    created_at: entity.created_at,
    updated_at: entity.updated_at,
    publisher_type: entity.publisher_type,
    transmission_type: entity.transmission_type,
    phone_code: entity.phone_code,
    phone: entity.phone,
    email: entity.email,
    traction_id: entity.traction.id,
    power: entity.power,
    displacement: entity.displacement,
    autonomy: entity.autonomy,
    battery_capacity: entity.battery_capacity,
    time_to_charge: entity.time_to_charge,
    license_plate: entity.license_plate,
    vin_code: entity.vin_code,
    features_ids: entity.features && entity.features.length > 0 ? (entity.features).map((feature) => feature.id) : [],
    services_ids: entity.services && entity.services.length > 0 ? (entity.services).map((service) => service.id) : [],
    vehicle_type_id: entity.vehicle_type?.id ?? null,
    category_id: entity.category?.id ?? entity.category_id ?? null,
    color_id: entity.color?.id ?? null,
    dgt_label_id: entity.dgt_label?.id ?? null,
    warranty_type_id: entity.warranty_type?.id ?? null,
    cuota_ids:
      entity.cuotas.length > 0
        ? entity.cuotas.map((c) => c.id)
        : [],
    suggestions: entity.suggestions,
    profile_id: entity.profile.id,
  };
}

@Injectable()
export class TypeOrmVehicleRepository extends VehicleRepository {
  constructor(
    @InjectRepository(VehicleEntity)
    private readonly vehicle_repository: Repository<VehicleEntity>,
    @InjectRepository(FeaturesEntity)
    private readonly features_repository: Repository<FeaturesEntity>,
    @InjectRepository(ServiceEntity)
    private readonly service_repository: Repository<ServiceEntity>,
    @InjectRepository(VehicleTypeEntity)
    private readonly vehicle_type_repository: Repository<VehicleTypeEntity>,
    @InjectRepository(ColorEntity)
    private readonly color_repository: Repository<ColorEntity>,
    @InjectRepository(DgtLabelEntity)
    private readonly dgt_label_repository: Repository<DgtLabelEntity>,
    @InjectRepository(WarrantyTypeEntity)
    private readonly warranty_type_repository: Repository<WarrantyTypeEntity>,
    @InjectRepository(TractionEntity)
    private readonly traction_repository: Repository<TractionEntity>,
    @InjectRepository(CuotaEntity)
    private readonly cuota_repository: Repository<CuotaEntity>,
    @InjectRepository(CategoryEntity)
    private readonly category_repository: Repository<CategoryEntity>,
    @InjectRepository(CatalogModelEntity)
    private readonly catalog_model_repository: Repository<CatalogModelEntity>,
    @InjectRepository(DealershipMembersEntity)
    private readonly dealership_members_repository: Repository<DealershipMembersEntity>,
  ) {
    super();
  }

  private trim_slug_array(value: string[] | undefined): string[] {
    if (!Array.isArray(value) || value.length === 0) {
      return [];
    }
    return value.map((s) => s.trim()).filter((s) => s.length > 0);
  }

  private async lookupMakeSlugsForModelSlugs(
    models_slugs: string[],
  ): Promise<string[]> {
    if (models_slugs.length === 0) {
      return [];
    }
    const rows = await this.catalog_model_repository
      .createQueryBuilder("catalog_model")
      .innerJoin(MakeEntity, "make", "make.id = catalog_model.make_id")
      .select("make.slug", "make_slug")
      .where("catalog_model.slug IN (:...models_slugs)", { models_slugs })
      .getRawMany<{ make_slug: string }>();
    return [...new Set(rows.map((row) => row.make_slug))];
  }

  private async resolveMakeModelFilterModeForFilter(
    filter: VehicleFilter,
  ): Promise<MakeModelFilterMode | undefined> {
    const makes_slugs = this.trim_slug_array(filter.makes_slugs);
    const models_slugs = this.trim_slug_array(filter.models_slugs);
    if (makes_slugs.length === 0 || models_slugs.length === 0) {
      return undefined;
    }
    const model_make_slugs = await this.lookupMakeSlugsForModelSlugs(models_slugs);
    return resolveMakeModelFilterMode(makes_slugs, model_make_slugs);
  }

  private async assert_feature_ids_exist(feature_ids: string[]): Promise<void> {
    const unique_ids = unique_string_ids(feature_ids);
    if (unique_ids.length === 0) {
      return;
    }
    const found = await this.features_repository.findBy({ id: In(unique_ids) });
    if (found.length !== unique_ids.length) {
      const found_set = new Set(found.map((f) => f.id));
      const missing = unique_ids.filter((id) => !found_set.has(id));
      throw new InvalidVehicleFeatureIdsException(missing);
    }
  }

  private async assert_cuota_ids_exist(cuota_ids: string[]): Promise<void> {
    const unique_ids = unique_string_ids(cuota_ids);
    if (unique_ids.length === 0) {
      return;
    }
    const found = await this.cuota_repository.findBy({ id: In(unique_ids) });
    if (found.length !== unique_ids.length) {
      const found_set = new Set(found.map((c) => c.id));
      const missing = unique_ids.find((id) => !found_set.has(id));
      throw new InvalidVehicleCatalogIdException("cuota_ids", missing ?? "");
    }
  }

  private async assert_service_ids_exist(service_ids: string[]): Promise<void> {
    const unique_ids = unique_string_ids(service_ids);
    if (unique_ids.length === 0) {
      return;
    }
    const found = await this.service_repository.findBy({ id: In(unique_ids) });
    if (found.length !== unique_ids.length) {
      const found_set = new Set(found.map((s) => s.id));
      const missing = unique_ids.filter((id) => !found_set.has(id));
      throw new InvalidVehicleServiceIdsException(missing);
    }
  }

  private async assert_optional_fk<T extends { id: string }>(
    repo: Repository<T>,
    id: string | null | undefined,
    field: string,
  ): Promise<void> {
    if (id === null || id === undefined) {
      return;
    }
    const found = await repo.findOne({
      where: { id } as FindOptionsWhere<T>,
    });
    if (!found) {
      throw new InvalidVehicleCatalogIdException(field, id);
    }
  }

  private async assert_vehicle_catalog_refs(p: PrimitiveVehicle): Promise<void> {
    await this.assert_feature_ids_exist(p.features_ids);
    await this.assert_service_ids_exist(p.services_ids);
    await this.assert_optional_fk(
      this.vehicle_type_repository,
      p.vehicle_type_id,
      "vehicle_type_id",
    );
    await this.assert_optional_fk(
      this.category_repository,
      p.category_id,
      "category_id",
    );
    await this.assert_optional_fk(this.color_repository, p.color_id, "color_id");
    await this.assert_optional_fk(
      this.dgt_label_repository,
      p.dgt_label_id,
      "dgt_label_id",
    );
    await this.assert_optional_fk(
      this.warranty_type_repository,
      p.warranty_type_id,
      "warranty_type_id",
    );
    await this.assert_cuota_ids_exist(p.cuota_ids);
    await this.assert_optional_fk(
      this.traction_repository,
      p.traction_id,
      "traction_id",
    );
  }

  private map_primitive_to_entity_payload(p: PrimitiveVehicle) {
    const feature_ids = unique_string_ids(p.features_ids);
    const service_ids = unique_string_ids(p.services_ids);
    const payload: DeepPartial<VehicleEntity> & {
      features: FeaturesEntity[];
      services: ServiceEntity[];
    } = {
      id: p.id,
      mileage: p.mileage,
      lat: p.lat,
      lng: p.lng,
      condition: p.condition,
      title: p.title,
      description: p.description,
      version_id: p.version_id,
      publisher_type: p.publisher_type,
      transmission_type: p.transmission_type,
      traction: this.traction_repository.create({ id: p.traction_id }),
      power: p.power,
      displacement: p.displacement,
      autonomy: p.autonomy,
      battery_capacity: p.battery_capacity,
      time_to_charge: p.time_to_charge,
      license_plate: p.license_plate,
      phone_code: p.phone_code,
      phone: p.phone,
      email: p.email,
      features: feature_ids.map((id) => this.features_repository.create({ id })),
      services: service_ids.map((id) => this.service_repository.create({ id })),
      vehicle_type: p.vehicle_type_id
        ? this.vehicle_type_repository.create({ id: p.vehicle_type_id })
        : null,
      category: p.category_id
        ? this.category_repository.create({ id: p.category_id })
        : null,
      color: p.color_id ? this.color_repository.create({ id: p.color_id }) : null,
      dgt_label: p.dgt_label_id
        ? this.dgt_label_repository.create({ id: p.dgt_label_id })
        : null,
      warranty_type: p.warranty_type_id
        ? this.warranty_type_repository.create({ id: p.warranty_type_id })
        : null,
      cuotas: unique_string_ids(p.cuota_ids).map((id) =>
        this.cuota_repository.create({ id }),
      ),
      profile: p.profile_id
        ? ({ id: p.profile_id } as ProfileEntity)
        : undefined,
    };
    if (p.status !== undefined) {
      payload.status = p.status;
    }
    if (p.status_change_message !== undefined) {
      payload.status_change_message = p.status_change_message;
    }
    if (p.is_featured !== undefined) {
      payload.is_featured = p.is_featured;
    }
    if (p.expires_at !== undefined) {
      payload.expires_at = p.expires_at;
    }
    if (p.views !== undefined) {
      payload.views = p.views;
    }
    if (p.created_at !== undefined) {
      payload.created_at = p.created_at;
    }
    if (p.updated_at !== undefined) {
      payload.updated_at = p.updated_at;
    }
    return payload;
  }

  async count_active_by_profile_id(profile_id: string): Promise<number> {
    return this.vehicle_repository.count({
      where: { profile: { id: profile_id } },
    });
  }

  async save(vehicle: Vehicle): Promise<void> {
    const p = vehicle.toPrimitives();
    await this.assert_vehicle_catalog_refs(p);
    const payload = this.map_primitive_to_entity_payload(p);
    await this.vehicle_repository.save(this.vehicle_repository.create(payload));
  }

  async findOne(id: string): Promise<VehicleDetail | null> {
    const vehicle = await this.vehicle_repository.findOne({
      where: { id },
      relations: {
        ...vehicle_catalog_relations,
        vehicle_prices: true,
      },
    });
    if (!vehicle) {
      return null;
    }
    const dealership_members = await this.dealership_members_repository.find({
      where: { profile_id: vehicle.profile.id },
      relations: {
        dealership: true,
      },
    });
    return entity_to_vehicle_detail(vehicle, dealership_members);
  }

  async findAll(
    filter: VehicleFilter,
  ): Promise<PaginatedResult<VehicleListItem>> {
    const { page, limit, order_by, order_direction } = filter;
    const skip = getSkip(page, limit);
    const qb = this.vehicle_repository.createQueryBuilder("vehicle")
      .leftJoinAndSelect("vehicle.features", "features")
      .leftJoinAndSelect("vehicle.services", "services")
      .leftJoinAndSelect("vehicle.vehicle_type", "vehicle_type")
      .leftJoinAndSelect("vehicle.category", "category")
      .leftJoinAndSelect("vehicle.color", "color")
      .leftJoinAndSelect("vehicle.dgt_label", "dgt_label")
      .leftJoinAndSelect("vehicle.warranty_type", "warranty_type")
      .leftJoinAndSelect("vehicle.cuotas", "cuotas")
      .leftJoinAndSelect("vehicle.images", "images")
      .leftJoinAndSelect("vehicle.traction", "traction")
      .leftJoinAndSelect("vehicle.profile", "profile")
      .leftJoinAndSelect(
        "vehicle.vehicle_prices",
        "vehicle_prices",
        "vehicle_prices.status = :active_vehicle_price_status",
        { active_vehicle_price_status: VEHICLE_PRICE_STATUS.ACTIVE },
      );

    const make_model_filter_mode =
      await this.resolveMakeModelFilterModeForFilter(filter);
    const apply_filters_options =
      make_model_filter_mode === undefined
        ? undefined
        : { make_model_filter_mode };
    applyFilters(qb, filter, apply_filters_options);

    const count_qb = qb.clone();
    (
      count_qb as unknown as { expressionMap: { orderBys: unknown[] } }
    ).expressionMap.orderBys = [];
    count_qb.select("COUNT(DISTINCT vehicle.id)", "cnt");
    const count_row = await count_qb.getRawOne<{ cnt: string }>();
    const total_count = Number(count_row?.cnt ?? 0);

    if (order_by) {
      qb.orderBy(`vehicle.${order_by}`, order_direction);
    }
    qb.skip(skip).take(limit);
    const rows = await qb.getMany();
    const vehicles = rows.map((row) => entity_to_list_item(row));
    return new PaginatedResult(vehicles, total_count, filter.page, filter.limit);
  }

  async update(vehicle: Vehicle): Promise<void> {
    const p = vehicle.toPrimitives();
    await this.assert_vehicle_catalog_refs(p);
    const payload = this.map_primitive_to_entity_payload(p);
    const preloaded = await this.vehicle_repository.preload(payload);
    if (!preloaded) {
      throw new VehicleNotFoundException(p.id);
    }
    await this.vehicle_repository.save(preloaded);
  }

  async remove(id: string): Promise<void> {
    await this.vehicle_repository.softDelete(id);
  }

  async adminFindAll(filter: AdminVehicleFilter): Promise<PaginatedResult<AdminVehicleListItem>> {
    const { page, limit, order_by, order_direction } = filter;
    const skip = getSkip(page, limit);
    const qb = this.vehicle_repository.createQueryBuilder("vehicle")
      .leftJoinAndSelect("vehicle.features", "features")
      .leftJoinAndSelect("vehicle.services", "services")
      .leftJoinAndSelect("vehicle.vehicle_type", "vehicle_type")
      .leftJoinAndSelect("vehicle.category", "category")
      .leftJoinAndSelect("vehicle.color", "color")
      .leftJoinAndSelect("vehicle.dgt_label", "dgt_label")
      .leftJoinAndSelect("vehicle.warranty_type", "warranty_type")
      .leftJoinAndSelect("vehicle.cuotas", "cuotas")
      .leftJoinAndSelect("vehicle.traction", "traction")
      .leftJoinAndSelect("vehicle.images", "images")
      .leftJoinAndSelect("vehicle.profile", "profile")
      .leftJoinAndSelect(
        "vehicle.vehicle_prices",
        "vehicle_prices",
        "vehicle_prices.status = :active_vehicle_price_status",
        { active_vehicle_price_status: VEHICLE_PRICE_STATUS.ACTIVE },
      );

    applyAdminFilters(qb, filter);

    const count_qb = qb.clone();
    (
      count_qb as unknown as { expressionMap: { orderBys: unknown[] } }
    ).expressionMap.orderBys = [];
    count_qb.select("COUNT(DISTINCT vehicle.id)", "cnt");
    const count_row = await count_qb.getRawOne<{ cnt: string }>();
    const total_count = Number(count_row?.cnt ?? 0);

    if (order_by) {
      qb.orderBy(`vehicle.${order_by}`, order_direction);
    }
    qb.skip(skip).take(limit);
    const rows = await qb.getMany();
    const vehicles = rows.map((row) => entity_to_admin_list_item(row));

    return new PaginatedResult(vehicles, total_count, filter.page, filter.limit);
  }

  async adminFindOne(id: string): Promise<AdminVehicleDetail | null> {
    const row = await this.vehicle_repository.findOne({
      where: { id },
      relations: {
        ...vehicle_catalog_relations,
        version: true,
        vehicle_prices: true,
      },
    });
    if (!row) {
      return null;
    }
    return entity_to_admin_vehicle_detail(row);
  }
}
