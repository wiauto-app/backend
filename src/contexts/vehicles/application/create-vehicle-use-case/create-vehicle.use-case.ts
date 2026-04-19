import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PrimitiveVehicle, Vehicle } from "../../domain/vehicle";
import { VehicleRepository } from "../../domain/vehicle.repository";
import { CreateVehicleDto } from "./create-vehicle.dto";


@Injectable()
export class CreateVehicleUseCase {
  constructor(
    private readonly vehicleRepository: VehicleRepository
  ) { }

  async execute(createVehicleDto: CreateVehicleDto): Promise<{ vehicle: PrimitiveVehicle }> {
    const vehicle = Vehicle.create(createVehicleDto);
    await this.vehicleRepository.save(vehicle);
    return { vehicle: vehicle.toPrimitives() };
  }
}