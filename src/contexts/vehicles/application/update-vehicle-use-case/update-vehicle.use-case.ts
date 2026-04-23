import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PrimitiveVehicle } from "../../domain/vehicle";
import { VehicleNotFoundException } from "../../domain/vehicle-not-found.exception";
import { VehicleRepository } from "../../domain/vehicle.repository";
import { UpdateVehicleDto } from "./update-vehicle.dto";

@Injectable()
export class UpdateVehicleUseCase {
  constructor(private readonly vehicleRepository: VehicleRepository) {}

  async execute(updateVehicleDto: UpdateVehicleDto): Promise<{ vehicle: PrimitiveVehicle }> {
    const existing = await this.vehicleRepository.findOne(updateVehicleDto.id);
    if (!existing) {
      throw new VehicleNotFoundException(updateVehicleDto.id);
    }

    const updated = existing.applyUpdates({
      price: updateVehicleDto.price,
      mileage: updateVehicleDto.mileage,
      lat: updateVehicleDto.lat,
      lng: updateVehicleDto.lng,
      condition: updateVehicleDto.condition,
      title: updateVehicleDto.title,
    });

    await this.vehicleRepository.update(updated);
    return { vehicle: updated.toPrimitives() };
  }
}
