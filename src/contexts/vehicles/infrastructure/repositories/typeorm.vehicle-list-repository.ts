import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { List } from "../../domain/entities/list";
import { VehicleListNotFoundException } from "../../domain/exceptions/vehicle-list-not-found.exception";
import { VehicleListDetail } from "../../domain/read-models/vehicle-list-detail";
import { VehicleListRepository } from "../../domain/repositories/vehicle-list.repository";
import { VehicleListEntity } from "../persistence/vehicle-list.entity";
import { VehicleListItemEntity } from "../persistence/vehicle-list-item.entity";
import type { VehicleImagesEntity } from "../../vehicle-images/infrastructure/persistence/vehicle-images.entity";
import { VEHICLE_PRICE_STATUS } from "../../vehicle-prices/domain/vehicle-price";

const first_image_url = (images: VehicleImagesEntity[] | undefined): string | null => {
  if (!images || images.length === 0) {
    return null;
  }
  const sorted = [...images].sort(
    (a, b) => a.created_at.getTime() - b.created_at.getTime(),
  );
  return sorted[0]?.url ?? null;
};

const get_active_price = (vehicle: { vehicle_prices?: { status: string; price: number }[] }): number => {
  const active = vehicle.vehicle_prices?.find(
    (item) => item.status === VEHICLE_PRICE_STATUS.ACTIVE,
  );
  return active?.price ?? 0;
};

const entity_to_list = (entity: VehicleListEntity): List =>
  List.fromPrimitives({
    id: entity.id,
    profile_id: entity.profile_id,
    is_default: entity.is_default,
    name: entity.name,
    description: entity.description,
    created_at: entity.created_at,
  });

@Injectable()
export class TypeOrmVehicleListRepository extends VehicleListRepository {
  constructor(
    @InjectRepository(VehicleListEntity)
    private readonly vehicle_list_repository: Repository<VehicleListEntity>,
    @InjectRepository(VehicleListItemEntity)
    private readonly vehicle_list_item_repository: Repository<VehicleListItemEntity>,
  ) {
    super();
  }

  async save(list: List): Promise<List> {
    const primitive = list.toPrimitives();
    const saved = await this.vehicle_list_repository.save(
      this.vehicle_list_repository.create({
        id: primitive.id,
        profile_id: primitive.profile_id,
        is_default: primitive.is_default,
        name: primitive.name,
        description: primitive.description,
        created_at: primitive.created_at,
      }),
    );
    return entity_to_list(saved);
  }

  async update(list: List): Promise<void> {
    const primitive = list.toPrimitives();
    const preloaded = await this.vehicle_list_repository.preload({
      id: primitive.id,
      profile_id: primitive.profile_id,
      is_default: primitive.is_default,
      name: primitive.name,
      description: primitive.description,
    });
    if (!preloaded) {
      throw new VehicleListNotFoundException(primitive.id);
    }
    await this.vehicle_list_repository.save(preloaded);
  }

  async findOne(id: string): Promise<List | null> {
    const row = await this.vehicle_list_repository.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return entity_to_list(row);
  }

  async findAllByProfileId(profile_id: string): Promise<List[]> {
    const rows = await this.vehicle_list_repository.find({
      where: { profile_id },
      order: { created_at: "ASC" },
    });
    return rows.map(entity_to_list);
  }

  async delete(id: string): Promise<void> {
    await this.vehicle_list_repository.delete(id);
  }

  async clearDefaultForProfile(profile_id: string): Promise<void> {
    await this.vehicle_list_repository.update(
      { profile_id, is_default: true },
      { is_default: false },
    );
  }

  async countByProfileId(profile_id: string): Promise<number> {
    return this.vehicle_list_repository.count({ where: { profile_id } });
  }

  async findOneWithDetail(id: string): Promise<VehicleListDetail | null> {
    const list = await this.vehicle_list_repository.findOne({ where: { id } });
    if (!list) {
      return null;
    }

    const item_rows = await this.vehicle_list_item_repository
      .createQueryBuilder("item")
      .leftJoinAndSelect("item.vehicle", "vehicle")
      .leftJoinAndSelect("vehicle.images", "images")
      .leftJoinAndSelect(
        "vehicle.vehicle_prices",
        "vehicle_prices",
        "vehicle_prices.status = :active_vehicle_price_status",
        { active_vehicle_price_status: VEHICLE_PRICE_STATUS.ACTIVE },
      )
      .where("item.list_id = :list_id", { list_id: id })
      .orderBy("item.created_at", "DESC")
      .getMany();

    return {
      id: list.id,
      profile_id: list.profile_id,
      is_default: list.is_default,
      name: list.name,
      description: list.description,
      created_at: list.created_at,
      items: item_rows.map((item) => ({
        id: item.id,
        vehicle_list_id: item.list_id,
        vehicle_id: item.vehicle_id,
        created_at: item.created_at,
        vehicle: {
          id: item.vehicle.id,
          title: item.vehicle.title,
          price: get_active_price(item.vehicle),
          image_url: first_image_url(item.vehicle.images),
        },
      })),
    };
  }
}
