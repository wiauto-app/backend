import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { VehicleFilter } from "@/src/contexts/vehicles/domain/filters/vehicle.filter";
import { VehicleRepository } from "@/src/contexts/vehicles/domain/repositories/vehicle.repository";

import { FindAllVehiclesUseCaseDto } from "./find-all-vehicles.dto";
import { VehicleListItemDto } from "./vehicle-list-item.dto";

@Injectable()
export class FindAllVehiclesUseCase {
  constructor(private readonly vehicle_repository: VehicleRepository) {}

  async execute(
    find_all_vehicles_dto: FindAllVehiclesUseCaseDto,
  ): Promise<PaginatedResult<VehicleListItemDto>> {
    const filter = new VehicleFilter({ ...find_all_vehicles_dto });
    const result = await this.vehicle_repository.find_all(filter);
    return result;
  }
}
