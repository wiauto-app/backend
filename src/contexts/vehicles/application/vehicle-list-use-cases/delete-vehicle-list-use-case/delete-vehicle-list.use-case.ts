import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { VehicleListForbiddenException } from "../../../domain/exceptions/vehicle-list-forbidden.exception";
import { VehicleListNotFoundException } from "../../../domain/exceptions/vehicle-list-not-found.exception";
import { VehicleListItemRepository } from "../../../domain/repositories/vehicle-list-item.repository";
import { VehicleListRepository } from "../../../domain/repositories/vehicle-list.repository";
import { DeleteVehicleListDto } from "./delete-vehicle-list.dto";

@Injectable()
export class DeleteVehicleListUseCase {
  constructor(
    private readonly vehicle_list_repository: VehicleListRepository,
    private readonly vehicle_list_item_repository: VehicleListItemRepository,
  ) {}

  async execute(dto: DeleteVehicleListDto): Promise<void> {
    const existing = await this.vehicle_list_repository.findOne(dto.list_id);
    if (!existing) {
      throw new VehicleListNotFoundException(dto.list_id);
    }

    if (existing.toPrimitives().profile_id !== dto.profile_id) {
      throw new VehicleListForbiddenException();
    }

    await this.vehicle_list_item_repository.decrementFavoritesByListId(
      dto.list_id,
    );
    await this.vehicle_list_repository.delete(dto.list_id);
  }
}
