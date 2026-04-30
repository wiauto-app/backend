import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { VehicleRepository } from "@/src/contexts/vehicles/domain/repositories/vehicle.repository";
import { FindAllVehiclesUseCaseDto } from "./find-all-vehicles.dto";
import { VehicleListItemDto } from "./vehicle-list-item.dto";

@Injectable()
export class FindAllVehiclesUseCase {
  constructor(private readonly vehicle_repository: VehicleRepository) {}

  async execute(
    find_all_vehicles_dto: FindAllVehiclesUseCaseDto,
  ): Promise<{ vehicles: VehicleListItemDto[]; total_count: number }> {
    return this.vehicle_repository.findAll(find_all_vehicles_dto);
  }
}