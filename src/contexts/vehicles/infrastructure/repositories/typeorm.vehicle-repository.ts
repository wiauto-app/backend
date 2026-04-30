import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectRepository } from "@nestjs/typeorm";
import { DeepPartial, FindOptionsWhere, In, Repository } from "typeorm";

import { PrimitiveVehicle, Vehicle } from "../../domain/entities/vehicle";
import { InvalidVehicleFeatureIdsException } from "../../domain/exceptions/invalid-vehicle-feature-ids.exception";
import { InvalidVehicleServiceIdsException } from "../../domain/exceptions/invalid-vehicle-service-ids.exception";
import { InvalidVehicleCatalogIdException } from "../../domain/exceptions/invalid-vehicle-catalog-id.exception";
import { VehicleNotFoundException } from "../../domain/exceptions/vehicle-not-found.exception";
import { getPaginationProps } from "@/src/contexts/shared/dto/getPaginationProps";
import { PaginationDto } from "@/src/contexts/shared/dto/pagination.dto";
import { VehicleListItem } from "../../domain/read-models/vehicle-list-item";
import { VehicleRepository } from "../../domain/repositories/vehicle.repository";
import { ColorEntity } from "../persistence/color.entity";
import { DgtLabelEntity } from "../persistence/dgt-label.entity";
import { FeaturesEntity } from "../persistence/features.entity";
import { ServiceEntity } from "../persistence/service.entity";
import { VehicleEntity } from "../persistence/vehicle.entity";
import { VehicleTypeEntity } from "../persistence/vehicle-type.entity";
import { WarrantyTypeEntity } from "../persistence/warranty-type.entity";
import { TractionEntity } from "../persistence/traction.entity";

const unique_string_ids = (ids: string[]): string[] => [...new Set(ids)];

const list_order_columns = new Set([
  "id",
  "price",
  "mileage",
  "title",
  "condition",
  "created_at",
  "updated_at",
]);

const vehicle_catalog_relations = {
  features: true,
  images: true,
  traction: true,
  vehicle_type: true,
  color: true,
  dgt_label: true,
  warranty_type: true,
  services: true,
} as const;

function entity_to_list_item(entity: VehicleEntity): VehicleListItem {
  return {
    id: entity.id,
    price: entity.price,
    mileage: entity.mileage,
    lat: Number(entity.lat),
    lng: Number(entity.lng),
    condition: entity.condition,
    title: entity.title,
    created_at: entity.created_at,
    images: (entity.images).map((image) => ({ id: image.id, url: image.url })),
    features: (entity.features).map((feature) => ({
      id: feature.id,
      name: feature.name,
      slug: feature.slug,
    })),
    services: (entity.services).map((service) => ({
      id: service.id,
      name: service.name,
      slug: service.slug,
    })),
    vehicle_type: entity.vehicle_type
      ? {
          id: entity.vehicle_type.id,
          name: entity.vehicle_type.name,
          slug: entity.vehicle_type.slug,
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
  };
}

function entity_to_primitives(entity: VehicleEntity): PrimitiveVehicle {
  return {
    id: entity.id,
    price: entity.price,
    mileage: entity.mileage,
    lat: Number(entity.lat),
    lng: Number(entity.lng),
    condition: entity.condition,
    title: entity.title,
    description: entity.description,
    version_id: entity.version_id,
    status: entity.status,
    is_featured: entity.is_featured,
    expires_at: entity.expires_at,
    views: entity.views,
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
    features_ids: (entity.features).map((feature) => feature.id),
    services_ids: (entity.services).map((service) => service.id),
    vehicle_type_id: entity.vehicle_type?.id ?? null,
    color_id: entity.color?.id ?? null,
    dgt_label_id: entity.dgt_label?.id ?? null,
    warranty_type_id: entity.warranty_type?.id ?? null,
    suggestions: entity.suggestions,
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
  ) {
    super();
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
      price: p.price,
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
      color: p.color_id ? this.color_repository.create({ id: p.color_id }) : null,
      dgt_label: p.dgt_label_id
        ? this.dgt_label_repository.create({ id: p.dgt_label_id })
        : null,
      warranty_type: p.warranty_type_id
        ? this.warranty_type_repository.create({ id: p.warranty_type_id })
        : null,
    };
    if (p.status !== undefined) {
      payload.status = p.status;
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

  async save(vehicle: Vehicle): Promise<void> {
    const p = vehicle.toPrimitives();
    await this.assert_vehicle_catalog_refs(p);
    const payload = this.map_primitive_to_entity_payload(p);
    await this.vehicle_repository.save(this.vehicle_repository.create(payload));
  }

  async findOne(id: string): Promise<Vehicle | null> {
    const row = await this.vehicle_repository.findOne({
      where: { id },
      relations: vehicle_catalog_relations,
    });
    if (!row) {
      return null;
    }
    return Vehicle.fromPrimitives(entity_to_primitives(row));
  }

  async findAll(
    pagination: PaginationDto,
  ): Promise<{ vehicles: VehicleListItem[]; total_count: number }> {
    const { skip, take, order_column, direction } = getPaginationProps(pagination);
    const order_key =
      list_order_columns.has(order_column) ? order_column : "created_at";
    const [rows, total_count] = await this.vehicle_repository.findAndCount({
      skip,
      take,
      order: { [order_key]: direction },
      relations: vehicle_catalog_relations,
    });
    return {
      vehicles: rows.map((row) => entity_to_list_item(row)),
      total_count,
    };
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
    await this.vehicle_repository.delete(id);
  }
}
