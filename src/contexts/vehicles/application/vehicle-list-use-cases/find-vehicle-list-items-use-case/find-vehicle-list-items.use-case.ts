import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { VehicleListForbiddenException } from "../../../domain/exceptions/vehicle-list-forbidden.exception";
import { VehicleListNotFoundException } from "../../../domain/exceptions/vehicle-list-not-found.exception";
import { VehicleListDetailItem } from "../../../domain/read-models/vehicle-list-detail";
import { VehicleListItemRepository } from "../../../domain/repositories/vehicle-list-item.repository";
import { VehicleListRepository } from "../../../domain/repositories/vehicle-list.repository";
import { FindVehicleListItemsDto } from "./find-vehicle-list-items.dto";

@Injectable()
export class FindVehicleListItemsUseCase {
  constructor(
    private readonly vehicle_list_repository: VehicleListRepository,
    private readonly vehicle_list_item_repository: VehicleListItemRepository,
  ) {}

  async execute(dto: FindVehicleListItemsDto): Promise<VehicleListDetailItem[]> {
    const list = await this.vehicle_list_repository.findOne(dto.list_id);
    if (!list) {
      throw new VehicleListNotFoundException(dto.list_id);
    }
    if (list.toPrimitives().profile_id !== dto.profile_id) {
      throw new VehicleListForbiddenException();
    }

    return this.vehicle_list_item_repository.findAllByListId(dto.list_id);
  }
}
