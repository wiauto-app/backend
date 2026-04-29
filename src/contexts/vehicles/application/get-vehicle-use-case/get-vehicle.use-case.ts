import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { VehicleRepository } from "../../domain/repositories/vehicle.repository";
import { GetVehicleDto } from "./get-vehicle.dto";
import { PrimitiveVehicle } from "../../domain/entities/vehicle";
import { VehicleNotFoundException } from "../../domain/exceptions/vehicle-not-found.exception";

@Injectable()
export class GetVehicleUseCase {

  constructor(
    private readonly vehicleRepository: VehicleRepository
  ) { }

  async execute(getVehicleDto: GetVehicleDto): Promise<{ vehicle: PrimitiveVehicle }> {
    const vehicle = await this.vehicleRepository.findOne(getVehicleDto.id);
    if (!vehicle) {
      throw new VehicleNotFoundException(getVehicleDto.id);
    }
    return { vehicle: vehicle.toPrimitives() };
  }
}