import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { GetVehicleDto } from "./get-vehicle.dto";
import { VehicleNotFoundException } from "../../../domain/exceptions/vehicle-not-found.exception";
import { VehicleDetail } from "../../../domain/read-models/vehicle-detail";
import { VehicleRepository } from "../../../domain/repositories/vehicle.repository";

@Injectable()
export class GetVehicleUseCase {
  constructor(private readonly vehicleRepository: VehicleRepository) {}

  async execute(
    getVehicleDto: GetVehicleDto,
  ): Promise<VehicleDetail> {
    const vehicle = await this.vehicleRepository.findOne(getVehicleDto.id);
    if (!vehicle) {
      throw new VehicleNotFoundException(getVehicleDto.id);
    }
    return vehicle;
  }
}