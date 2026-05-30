import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { ListItem, PrimitiveListItem } from "../../../domain/entities/list-item";
import { VehicleListForbiddenException } from "../../../domain/exceptions/vehicle-list-forbidden.exception";
import { VehicleListNotFoundException } from "../../../domain/exceptions/vehicle-list-not-found.exception";
import { VehicleNotFoundException } from "../../../domain/exceptions/vehicle-not-found.exception";
import { VehicleListItemRepository } from "../../../domain/repositories/vehicle-list-item.repository";
import { VehicleListRepository } from "../../../domain/repositories/vehicle-list.repository";
import { VehicleRepository } from "../../../domain/repositories/vehicle.repository";
import { AddVehicleListItemDto } from "./add-vehicle-list-item.dto";

@Injectable()
export class AddVehicleListItemUseCase {
  constructor(
    private readonly vehicle_list_repository: VehicleListRepository,
    private readonly vehicle_list_item_repository: VehicleListItemRepository,
    private readonly vehicle_repository: VehicleRepository,
  ) {}

  async execute(dto: AddVehicleListItemDto): Promise<PrimitiveListItem> {
    const list = await this.vehicle_list_repository.findOne(dto.list_id);
    if (!list) {
      throw new VehicleListNotFoundException(dto.list_id);
    }
    if (list.toPrimitives().profile_id !== dto.profile_id) {
      throw new VehicleListForbiddenException();
    }

    const vehicle = await this.vehicle_repository.findOne(dto.vehicle_id);
    if (!vehicle) {
      throw new VehicleNotFoundException(dto.vehicle_id);
    }

    const item = ListItem.create({
      list_id: dto.list_id,
      vehicle_id: dto.vehicle_id,
    });
    await this.vehicle_list_item_repository.add(item);
    return item.toPrimitives();
  }
}
