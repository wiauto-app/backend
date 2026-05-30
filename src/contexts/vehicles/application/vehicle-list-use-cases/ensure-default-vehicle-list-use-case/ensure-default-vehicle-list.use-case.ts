import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { List } from "../../../domain/entities/list";
import { VehicleListRepository } from "../../../domain/repositories/vehicle-list.repository";

@Injectable()
export class EnsureDefaultVehicleListUseCase {
  constructor(
    private readonly vehicle_list_repository: VehicleListRepository,
  ) {}

  async execute(profile_id: string): Promise<void> {
    const count = await this.vehicle_list_repository.countByProfileId(profile_id);
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
}
