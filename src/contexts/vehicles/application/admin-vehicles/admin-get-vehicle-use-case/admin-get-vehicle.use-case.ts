import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { AdminVehicleDetail } from "../../../domain/read-models/admin-vehicle-detail";
import { VehicleNotFoundException } from "../../../domain/exceptions/vehicle-not-found.exception";
import { VehicleRepository } from "../../../domain/repositories/vehicle.repository";
import { AdminGetVehicleDto } from "./admin-get-vehicle.dto";

@Injectable()
export class AdminGetVehicleUseCase {
  constructor(private readonly vehicle_repository: VehicleRepository) {}

  async execute(
    dto: AdminGetVehicleDto,
  ): Promise<{ vehicle: AdminVehicleDetail }> {
    const vehicle = await this.vehicle_repository.adminFindOne(dto.id);
    if (!vehicle) {
      throw new VehicleNotFoundException(dto.id);
    }
    return { vehicle };
  }
}
