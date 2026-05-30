import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { VehicleListForbiddenException } from "../../../domain/exceptions/vehicle-list-forbidden.exception";
import { VehicleListNotFoundException } from "../../../domain/exceptions/vehicle-list-not-found.exception";
import { VehicleListItemRepository } from "../../../domain/repositories/vehicle-list-item.repository";
import { VehicleListRepository } from "../../../domain/repositories/vehicle-list.repository";
import { RemoveVehicleListItemDto } from "./remove-vehicle-list-item.dto";

@Injectable()
export class RemoveVehicleListItemUseCase {
  constructor(
    private readonly vehicle_list_repository: VehicleListRepository,
    private readonly vehicle_list_item_repository: VehicleListItemRepository,
  ) {}

  async execute(dto: RemoveVehicleListItemDto): Promise<void> {
    const list = await this.vehicle_list_repository.findOne(dto.list_id);
    if (!list) {
      throw new VehicleListNotFoundException(dto.list_id);
    }
    if (list.toPrimitives().profile_id !== dto.profile_id) {
      throw new VehicleListForbiddenException();
    }

    await this.vehicle_list_item_repository.remove(dto.list_id, dto.vehicle_id);
  }
}
