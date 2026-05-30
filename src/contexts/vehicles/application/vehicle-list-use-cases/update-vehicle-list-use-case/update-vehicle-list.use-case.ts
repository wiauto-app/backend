import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { VehicleListForbiddenException } from "../../../domain/exceptions/vehicle-list-forbidden.exception";
import { VehicleListNotFoundException } from "../../../domain/exceptions/vehicle-list-not-found.exception";
import { PrimitiveList } from "../../../domain/entities/list";
import { VehicleListRepository } from "../../../domain/repositories/vehicle-list.repository";
import { UpdateVehicleListDto } from "./update-vehicle-list.dto";

@Injectable()
export class UpdateVehicleListUseCase {
  constructor(
    private readonly vehicle_list_repository: VehicleListRepository,
  ) {}

  async execute(dto: UpdateVehicleListDto): Promise<PrimitiveList> {
    const existing = await this.vehicle_list_repository.findOne(dto.list_id);
    if (!existing) {
      throw new VehicleListNotFoundException(dto.list_id);
    }

    const primitive = existing.toPrimitives();
    if (primitive.profile_id !== dto.profile_id) {
      throw new VehicleListForbiddenException();
    }

    if (dto.is_default) {
      await this.vehicle_list_repository.clearDefaultForProfile(dto.profile_id);
    }

    const updated = existing.update({
      name: dto.name,
      description: dto.description,
      is_default: dto.is_default,
    });
    await this.vehicle_list_repository.update(updated);
    return updated.toPrimitives();
  }
}
