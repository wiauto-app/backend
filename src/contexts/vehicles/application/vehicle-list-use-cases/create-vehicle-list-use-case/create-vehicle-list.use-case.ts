import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { List, PrimitiveList } from "../../../domain/entities/list";
import { VehicleListRepository } from "../../../domain/repositories/vehicle-list.repository";
import { EnsureDefaultVehicleListUseCase } from "../ensure-default-vehicle-list-use-case/ensure-default-vehicle-list.use-case";
import { CreateVehicleListDto } from "./create-vehicle-list.dto";

@Injectable()
export class CreateVehicleListUseCase {
  constructor(
    private readonly vehicle_list_repository: VehicleListRepository,
    private readonly ensure_default_vehicle_list_use_case: EnsureDefaultVehicleListUseCase,
  ) {}

  async execute(dto: CreateVehicleListDto): Promise<PrimitiveList> {
    await this.ensure_default_vehicle_list_use_case.execute(dto.profile_id);

    if (dto.is_default) {
      await this.vehicle_list_repository.clearDefaultForProfile(dto.profile_id);
    }

    const list = List.create({
      profile_id: dto.profile_id,
      is_default: dto.is_default ?? false,
      name: dto.name,
      description: dto.description ?? null,
    });
    await this.vehicle_list_repository.save(list);
    return list.toPrimitives();
  }
}
