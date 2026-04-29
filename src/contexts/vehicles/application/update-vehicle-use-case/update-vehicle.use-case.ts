import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import {
  PrimitiveVehicle,
  VehicleUpdateFields,
} from "../../domain/entities/vehicle";
import { VehicleNotFoundException } from "../../domain/exceptions/vehicle-not-found.exception";
import { VehicleRepository } from "../../domain/repositories/vehicle.repository";
import { UpdateVehicleDto } from "./update-vehicle.dto";

@Injectable()
export class UpdateVehicleUseCase {
  constructor(private readonly vehicleRepository: VehicleRepository) {}

  async execute(
    updateVehicleDto: UpdateVehicleDto,
  ): Promise<{ vehicle: PrimitiveVehicle }> {
    const existing = await this.vehicleRepository.findOne(updateVehicleDto.id);
    if (!existing) {
      throw new VehicleNotFoundException(updateVehicleDto.id);
    }

    const prev = existing.toPrimitives();
    const patch: VehicleUpdateFields = {
      price: updateVehicleDto.price,
      mileage: updateVehicleDto.mileage,
      lat: updateVehicleDto.lat,
      lng: updateVehicleDto.lng,
      condition: updateVehicleDto.condition,
      title: updateVehicleDto.title,
      description: updateVehicleDto.description ?? prev.description,
      transmission_type:
        updateVehicleDto.transmission_type ?? prev.transmission_type,
      traction_id: updateVehicleDto.traction_id ?? prev.traction_id,
      power: updateVehicleDto.power ?? prev.power,
      displacement: updateVehicleDto.displacement ?? prev.displacement,
      autonomy: updateVehicleDto.autonomy ?? prev.autonomy,
      battery_capacity:
        updateVehicleDto.battery_capacity ?? prev.battery_capacity,
      time_to_charge: updateVehicleDto.time_to_charge ?? prev.time_to_charge,
      license_plate: updateVehicleDto.license_plate ?? prev.license_plate,
    };
    if (updateVehicleDto.features_ids !== undefined) {
      patch.features_ids = updateVehicleDto.features_ids;
    }
    if (updateVehicleDto.services_ids !== undefined) {
      patch.services_ids = updateVehicleDto.services_ids;
    }
    if (updateVehicleDto.vehicle_type_id !== undefined) {
      patch.vehicle_type_id = updateVehicleDto.vehicle_type_id;
    }
    if (updateVehicleDto.color_id !== undefined) {
      patch.color_id = updateVehicleDto.color_id;
    }
    if (updateVehicleDto.dgt_label_id !== undefined) {
      patch.dgt_label_id = updateVehicleDto.dgt_label_id;
    }
    if (updateVehicleDto.warranty_type_id !== undefined) {
      patch.warranty_type_id = updateVehicleDto.warranty_type_id;
    }

    const updated = existing.applyUpdates(patch);

    await this.vehicleRepository.update(updated);
    return { vehicle: updated.toPrimitives() };
  }
}
