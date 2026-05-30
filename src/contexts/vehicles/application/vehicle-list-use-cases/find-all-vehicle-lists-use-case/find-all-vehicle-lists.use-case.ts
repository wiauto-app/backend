import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { PrimitiveList } from "../../../domain/entities/list";
import { VehicleListRepository } from "../../../domain/repositories/vehicle-list.repository";
import { EnsureDefaultVehicleListUseCase } from "../ensure-default-vehicle-list-use-case/ensure-default-vehicle-list.use-case";
import { FindAllVehicleListsDto } from "./find-all-vehicle-lists.dto";

@Injectable()
export class FindAllVehicleListsUseCase {
  constructor(
    private readonly vehicle_list_repository: VehicleListRepository,
    private readonly ensure_default_vehicle_list_use_case: EnsureDefaultVehicleListUseCase,
  ) {}

  async execute(dto: FindAllVehicleListsDto): Promise<PrimitiveList[]> {
    await this.ensure_default_vehicle_list_use_case.execute(dto.profile_id);
    const lists = await this.vehicle_list_repository.findAllByProfileId(
      dto.profile_id,
    );
    return lists.map((list) => list.toPrimitives());
  }
}
