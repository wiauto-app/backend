import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, QueryFailedError, Repository } from "typeorm";

import { ListItem } from "../../domain/entities/list-item";
import { VehicleListItemAlreadyExistsException } from "../../domain/exceptions/vehicle-list-item-already-exists.exception";
import { VehicleListItemNotFoundException } from "../../domain/exceptions/vehicle-list-item-not-found.exception";
import { VehicleListDetailItem } from "../../domain/read-models/vehicle-list-detail";
import { VehicleListItemRepository } from "../../domain/repositories/vehicle-list-item.repository";
import { VehicleEntity } from "../persistence/vehicle.entity";
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

const is_unique_violation = (error: unknown): boolean =>
  error instanceof QueryFailedError &&
  (error as QueryFailedError & { driverError?: { code?: string } }).driverError
    ?.code === "23505";

const decrement_favorites = async (
  manager: DataSource["manager"],
  vehicle_id: string,
): Promise<void> => {
  await manager
    .createQueryBuilder()
    .update(VehicleEntity)
    .set({ favorites: () => "GREATEST(favorites - 1, 0)" })
    .where("id = :id", { id: vehicle_id })
    .execute();
};

@Injectable()
export class TypeOrmVehicleListItemRepository extends VehicleListItemRepository {
  constructor(
    @InjectRepository(VehicleListItemEntity)
    private readonly vehicle_list_item_repository: Repository<VehicleListItemEntity>,
    @InjectDataSource()
    private readonly data_source: DataSource,
  ) {
    super();
  }

  async add(item: ListItem): Promise<ListItem> {
    const primitive = item.toPrimitives();

    try {
      await this.data_source.transaction(async (manager) => {
        await manager.save(
          manager.create(VehicleListItemEntity, {
            id: primitive.id,
            list_id: primitive.list_id,
            vehicle_id: primitive.vehicle_id,
            created_at: primitive.created_at,
          }),
        );
        await manager.increment(
          VehicleEntity,
          { id: primitive.vehicle_id },
          "favorites",
          1,
        );
      });
    } catch (error) {
      if (is_unique_violation(error)) {
        throw new VehicleListItemAlreadyExistsException();
      }
      throw error;
    }

    return item;
  }

  async remove(list_id: string, vehicle_id: string): Promise<void> {
    await this.data_source.transaction(async (manager) => {
      const result = await manager.delete(VehicleListItemEntity, {
        list_id,
        vehicle_id,
      });
      if (!result.affected) {
        throw new VehicleListItemNotFoundException(list_id, vehicle_id);
      }
      await decrement_favorites(manager, vehicle_id);
    });
  }

  async findAllByListId(list_id: string): Promise<VehicleListDetailItem[]> {
    const rows = await this.vehicle_list_item_repository
      .createQueryBuilder("item")
      .leftJoinAndSelect("item.vehicle", "vehicle")
      .leftJoinAndSelect("vehicle.images", "images")
      .leftJoinAndSelect(
        "vehicle.vehicle_prices",
        "vehicle_prices",
        "vehicle_prices.status = :active_vehicle_price_status",
        { active_vehicle_price_status: VEHICLE_PRICE_STATUS.ACTIVE },
      )
      .where("item.list_id = :list_id", { list_id })
      .orderBy("item.created_at", "DESC")
      .getMany();

    return rows.map((item) => ({
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
    }));
  }

  async exists(list_id: string, vehicle_id: string): Promise<boolean> {
    const count = await this.vehicle_list_item_repository.count({
      where: { list_id, vehicle_id },
    });
    return count > 0;
  }

  async decrementFavoritesByListId(list_id: string): Promise<void> {
    const rows = await this.vehicle_list_item_repository.find({
      where: { list_id },
      select: { vehicle_id: true },
    });
    if (rows.length === 0) {
      return;
    }

    await this.data_source.transaction(async (manager) => {
      for (const row of rows) {
        await decrement_favorites(manager, row.vehicle_id);
      }
    });
  }
}
