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
import type { VehiclePriceEntity } from "../../vehicle-prices/infrastructure/persistence/vehicle-price.entity";
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

const get_active_price = (vehicle_prices: VehiclePriceEntity[] | undefined): number => {
  const active = vehicle_prices?.find(
    (item) => item.status === VEHICLE_PRICE_STATUS.ACTIVE,
  );
  return active?.price ?? 0;
};

const get_previous_price = (
  vehicle_prices: VehiclePriceEntity[] | undefined,
): number | null => {
  const previous = [...(vehicle_prices ?? [])]
    .filter((item) => item.status === VEHICLE_PRICE_STATUS.INACTIVE)
    .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())[0];
  return previous?.price ?? null;
};

const map_vehicle_preview = (vehicle: VehicleEntity) => {
  const price = get_active_price(vehicle.vehicle_prices);
  const previous_price = get_previous_price(vehicle.vehicle_prices);

  return {
    id: vehicle.id,
    version_summary: {
      make_name: vehicle.version?.make?.name ?? "",
      model_name: vehicle.version?.model?.name ?? "",
      version_name: vehicle.version?.name ?? "",
    },
    price,
    image_url: first_image_url(vehicle.images),
    created_at: vehicle.created_at,
    condition: vehicle.condition,
    is_featured: vehicle.is_featured,
    category: vehicle.category
      ? { id: vehicle.category.id, name: vehicle.category.name }
      : null,
    publisher_id: vehicle.profile.id,
    publisher_name: vehicle.profile.name,
    previous_price,
    price_change:
      previous_price === null ? null : price - previous_price,
  };
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
      .leftJoinAndSelect("vehicle.category", "category")
      .leftJoinAndSelect("vehicle.profile", "profile")
      .leftJoinAndSelect("vehicle.version", "version")
      .leftJoinAndSelect("version.make", "version_make")
      .leftJoinAndSelect("version.model", "version_model")
      .leftJoinAndSelect("vehicle.vehicle_prices", "vehicle_prices")
      .where("item.list_id = :list_id", { list_id })
      .orderBy("item.created_at", "DESC")
      .getMany();

    return rows.map((item) => ({
      id: item.id,
      vehicle_list_id: item.list_id,
      vehicle_id: item.vehicle_id,
      created_at: item.created_at,
      vehicle: map_vehicle_preview(item.vehicle),
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

  async findProfileIdsByVehicleId(vehicle_id: string): Promise<string[]> {
    const rows = await this.vehicle_list_item_repository
      .createQueryBuilder("item")
      .innerJoin("item.vehicle_list", "vehicle_list")
      .select("vehicle_list.profile_id", "profile_id")
      .where("item.vehicle_id = :vehicle_id", { vehicle_id })
      .getRawMany<{ profile_id: string }>();

    return [...new Set(rows.map((row) => row.profile_id))];
  }

  async findStaleFavoriteReminders(params: {
    older_than_days: number;
  }): Promise<Array<{ profile_id: string; vehicle_id: string; added_at: Date }>> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - params.older_than_days);

    const rows = await this.vehicle_list_item_repository
      .createQueryBuilder("item")
      .innerJoin("item.vehicle_list", "vehicle_list")
      .select("vehicle_list.profile_id", "profile_id")
      .addSelect("item.vehicle_id", "vehicle_id")
      .addSelect("item.created_at", "added_at")
      .where("item.created_at <= :threshold", { threshold })
      .getRawMany<{ profile_id: string; vehicle_id: string; added_at: Date }>();

    return rows;
  }
}
