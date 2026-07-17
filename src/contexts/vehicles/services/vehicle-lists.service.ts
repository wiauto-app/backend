import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { List, PrimitiveList } from "../types/list";
import { ListItem, PrimitiveListItem } from "../types/list-item";
import { VehicleListForbiddenException } from "../exceptions/vehicle-list-forbidden.exception";
import { VehicleListNotFoundException } from "../exceptions/vehicle-list-not-found.exception";
import { VehicleNotFoundException } from "../exceptions/vehicle-not-found.exception";
import {
  VehicleListDetail,
  VehicleListDetailItem,
} from "../types/vehicle-list-detail";
import { TypeOrmVehicleRepository } from "@/src/contexts/vehicles/repositories/typeorm.vehicle-repository";
import { TypeOrmVehicleListItemRepository } from "../repositories/typeorm.vehicle-list-item-repository";
import { TypeOrmVehicleListRepository } from "../repositories/typeorm.vehicle-list-repository";

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

@Injectable()
export class VehicleListsService {
  constructor(
    private readonly vehicle_list_repository: TypeOrmVehicleListRepository,
    private readonly vehicle_list_item_repository: TypeOrmVehicleListItemRepository,
    private readonly vehicle_repository: TypeOrmVehicleRepository,
  ) {}

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
    return list.toPrimitives();
  }

  async findAll(profile_id: string): Promise<PrimitiveList[]> {
    await this.ensureDefault(profile_id);
    const lists =
      await this.vehicle_list_repository.findAllByProfileId(profile_id);
    return lists.map((list) => list.toPrimitives());
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

    const item = ListItem.create({
      list_id: input.list_id,
      vehicle_id: input.vehicle_id,
    });
    await this.vehicle_list_item_repository.add(item);
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
  }

  async findItems(
    input: VehicleListOwnershipInput,
  ): Promise<VehicleListDetailItem[]> {
    const list = await this.vehicle_list_repository.findOne(input.list_id);
    if (!list) {
      throw new VehicleListNotFoundException(input.list_id);
    }
    if (list.toPrimitives().profile_id !== input.profile_id) {
      throw new VehicleListForbiddenException();
    }

    return this.vehicle_list_item_repository.findAllByListId(input.list_id);
  }
}
