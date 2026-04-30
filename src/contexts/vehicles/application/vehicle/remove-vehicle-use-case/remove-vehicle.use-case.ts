import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { VehicleNotFoundException } from "../../../domain/exceptions/vehicle-not-found.exception";
import { VehicleRepository } from "../../../domain/repositories/vehicle.repository";
import { VehicleImageRepository } from "../../../vehicle-images/domain/vehicle-imagen.repository";
import { RemoveVehicleDto } from "./remove-vehicle.dto";

@Injectable()
export class RemoveVehicleUseCase {
  constructor(
    private readonly vehicle_repository: VehicleRepository,
    private readonly vehicle_image_repository: VehicleImageRepository,
  ) {}

  async execute(removeVehicleDto: RemoveVehicleDto): Promise<void> {
    const existing = await this.vehicle_repository.findOne(removeVehicleDto.id);

    if (!existing) {
      throw new VehicleNotFoundException(removeVehicleDto.id);
    }

    await this.vehicle_image_repository.remove_storage_for_vehicle(
      removeVehicleDto.id,
    );
    await this.vehicle_repository.remove(removeVehicleDto.id);
  }
}
