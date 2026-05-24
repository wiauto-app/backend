import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { VehicleRepository } from "../../../domain/repositories/vehicle.repository";
import { AdminVehicleFilter } from "../../../domain/filters/admin-vehicle.filter";
import { AdminFindAllVehiclesDto } from "./admin-find-all-vehicles.dto";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { AdminVehicleListItem } from "../../../domain/read-models/vehicle-list-item";


@Injectable()
export class AdminFindAllVehiclesUseCase {

  constructor(private readonly vehicleRepository: VehicleRepository) {}

  async execute(adminFindAllVehiclesDto: AdminFindAllVehiclesDto): Promise<PaginatedResult<AdminVehicleListItem>> {
    const filter = new AdminVehicleFilter({ ...adminFindAllVehiclesDto });
    const result = await this.vehicleRepository.adminFindAll(filter);
    return result;
  }
}