import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";

import { List, PrimitiveList, VehicleListSummary } from "../types/list";
import { ListItem, PrimitiveListItem } from "../types/list-item";
import { VehicleListForbiddenException } from "../exceptions/vehicle-list-forbidden.exception";
import { VehicleListItemAlreadyExistsException } from "../exceptions/vehicle-list-item-already-exists.exception";
import { VehicleListNotFoundException } from "../exceptions/vehicle-list-not-found.exception";
import { VehicleNotFoundException } from "../exceptions/vehicle-not-found.exception";
import {
  VehicleListDetail,
  VehicleListDetailItem,
} from "../types/vehicle-list-detail";
import { TypeOrmVehicleRepository } from "@/src/contexts/vehicles/repositories/typeorm.vehicle-repository";
import { TypeOrmVehicleListItemRepository } from "../repositories/typeorm.vehicle-list-item-repository";
import { TypeOrmVehicleListRepository } from "../repositories/typeorm.vehicle-list-repository";
import { VehicleListFavoritesCacheService } from "./vehicle-list-favorites-cache.service";
import type {
  VehicleListFavoriteMembership,
  VehicleListFavoritesSnapshot,
} from "../types/vehicle-list-favorites-snapshot";

export interface CreateVehicleListInput {
  profile_id: string;
  name: string;
  description?: string | null;
  is_default?: boolean;
}

export interface UpdateVehicleListInput {
  list_id: string;
  profile_id: string;
  name?: string;
  description?: string | null;
  is_default?: boolean;
}

export interface VehicleListOwnershipInput {
  list_id: string;
  profile_id: string;
}

export interface AddVehicleListItemInput {
  list_id: string;
  profile_id: string;
  vehicle_id: string;
}

export interface RemoveVehicleListItemInput {
  list_id: string;
  profile_id: string;
  vehicle_id: string;
}

export interface FindVehicleListItemsInput {
  listId: string;
  profileId: string;
  page: number;
  limit: number;
}

@Injectable()
export class VehicleListsService {
  constructor(
    private readonly vehicle_list_repository: TypeOrmVehicleListRepository,
    private readonly vehicle_list_item_repository: TypeOrmVehicleListItemRepository,
    private readonly vehicle_repository: TypeOrmVehicleRepository,
    private readonly vehicle_list_favorites_cache_service: VehicleListFavoritesCacheService,
  ) {}

  private async invalidateFavoritesCache(profile_id: string): Promise<void> {
    await this.vehicle_list_favorites_cache_service.invalidate(profile_id);
  }

  private buildMemberships(
    pairs: Array<{ list_id: string; vehicle_id: string }>,
  ): VehicleListFavoriteMembership[] {
    const by_vehicle = new Map<string, string[]>();

    for (const pair of pairs) {
      const list_ids = by_vehicle.get(pair.vehicle_id) ?? [];
      list_ids.push(pair.list_id);
      by_vehicle.set(pair.vehicle_id, list_ids);
    }

    return [...by_vehicle.entries()].map(([vehicle_id, list_ids]) => ({
      vehicle_id,
      list_ids,
    }));
  }

  async getFavoritesSnapshot(
    profile_id: string,
  ): Promise<VehicleListFavoritesSnapshot> {
    const cached =
      await this.vehicle_list_favorites_cache_service.get(profile_id);
    if (cached) {
      return cached;
    }

    const lists = await this.findAll(profile_id);
    const pairs =
      await this.vehicle_list_item_repository.findListVehiclePairsByProfileId(
        profile_id,
      );
    const snapshot: VehicleListFavoritesSnapshot = {
      lists,
      memberships: this.buildMemberships(pairs),
    };

    await this.vehicle_list_favorites_cache_service.set(profile_id, snapshot);
    return snapshot;
  }

  async ensureDefault(profile_id: string): Promise<void> {
    const count =
      await this.vehicle_list_repository.countByProfileId(profile_id);
    if (count > 0) {
      return;
    }

    const default_list = List.create({
      profile_id,
      is_default: true,
      name: "Favoritos",
      description: null,
    });
    await this.vehicle_list_repository.save(default_list);
  }

  async create(input: CreateVehicleListInput): Promise<PrimitiveList> {
    await this.ensureDefault(input.profile_id);

    if (input.is_default) {
      await this.vehicle_list_repository.clearDefaultForProfile(
        input.profile_id,
      );
    }

    const list = List.create({
      profile_id: input.profile_id,
      is_default: input.is_default ?? false,
      name: input.name,
      description: input.description ?? null,
    });
    await this.vehicle_list_repository.save(list);
    await this.invalidateFavoritesCache(input.profile_id);
    return list.toPrimitives();
  }

  async findAll(profileId: string): Promise<VehicleListSummary[]> {
    await this.ensureDefault(profileId);
    const lists =
      await this.vehicle_list_repository.findAllByProfileId(profileId);
    const primitives = lists.map((list) => list.toPrimitives());
    const counts = await this.vehicle_list_item_repository.countByListIds(
      primitives.map((list) => list.id),
    );

    return primitives.map((list) => ({
      ...list,
      item_count: counts.get(list.id) ?? 0,
    }));
  }

  async findOne(input: VehicleListOwnershipInput): Promise<VehicleListDetail> {
    const detail = await this.vehicle_list_repository.findOneWithDetail(
      input.list_id,
    );
    if (!detail) {
      throw new VehicleListNotFoundException(input.list_id);
    }
    if (detail.profile_id !== input.profile_id) {
      throw new VehicleListForbiddenException();
    }
    return detail;
  }

  async update(input: UpdateVehicleListInput): Promise<PrimitiveList> {
    const existing = await this.vehicle_list_repository.findOne(input.list_id);
    if (!existing) {
      throw new VehicleListNotFoundException(input.list_id);
    }

    const primitive = existing.toPrimitives();
    if (primitive.profile_id !== input.profile_id) {
      throw new VehicleListForbiddenException();
    }

    if (input.is_default) {
      await this.vehicle_list_repository.clearDefaultForProfile(
        input.profile_id,
      );
    }

    const updated = existing.update({
      name: input.name,
      description: input.description,
      is_default: input.is_default,
    });
    await this.vehicle_list_repository.update(updated);
    await this.invalidateFavoritesCache(input.profile_id);
    return updated.toPrimitives();
  }

  async remove(input: VehicleListOwnershipInput): Promise<void> {
    const existing = await this.vehicle_list_repository.findOne(input.list_id);
    if (!existing) {
      throw new VehicleListNotFoundException(input.list_id);
    }

    if (existing.toPrimitives().profile_id !== input.profile_id) {
      throw new VehicleListForbiddenException();
    }

    await this.vehicle_list_item_repository.decrementFavoritesByListId(
      input.list_id,
    );
    await this.vehicle_list_repository.delete(input.list_id);
    await this.invalidateFavoritesCache(input.profile_id);
  }

  async addItem(input: AddVehicleListItemInput): Promise<PrimitiveListItem> {
    const list = await this.vehicle_list_repository.findOne(input.list_id);
    if (!list) {
      throw new VehicleListNotFoundException(input.list_id);
    }
    if (list.toPrimitives().profile_id !== input.profile_id) {
      throw new VehicleListForbiddenException();
    }

    const vehicle = await this.vehicle_repository.findOne(input.vehicle_id);
    if (!vehicle) {
      throw new VehicleNotFoundException(input.vehicle_id);
    }

    const alreadyExists = await this.vehicle_list_item_repository.exists(
      input.list_id,
      input.vehicle_id,
    );
    if (alreadyExists) {
      throw new VehicleListItemAlreadyExistsException();
    }

    const item = ListItem.create({
      list_id: input.list_id,
      vehicle_id: input.vehicle_id,
    });
    await this.vehicle_list_item_repository.add(item);
    await this.invalidateFavoritesCache(input.profile_id);
    return item.toPrimitives();
  }

  async removeItem(input: RemoveVehicleListItemInput): Promise<void> {
    const list = await this.vehicle_list_repository.findOne(input.list_id);
    if (!list) {
      throw new VehicleListNotFoundException(input.list_id);
    }
    if (list.toPrimitives().profile_id !== input.profile_id) {
      throw new VehicleListForbiddenException();
    }

    await this.vehicle_list_item_repository.remove(
      input.list_id,
      input.vehicle_id,
    );
    await this.invalidateFavoritesCache(input.profile_id);
  }

  async findItems(
    input: FindVehicleListItemsInput,
  ): Promise<PaginatedResult<VehicleListDetailItem>> {
    const list = await this.vehicle_list_repository.findOne(input.listId);
    if (!list) {
      throw new VehicleListNotFoundException(input.listId);
    }
    if (list.toPrimitives().profile_id !== input.profileId) {
      throw new VehicleListForbiddenException();
    }

    return this.vehicle_list_item_repository.findAllByListId(
      input.listId,
      input.page,
      input.limit,
    );
  }
}
