import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import {
  PrimitiveVehicle,
  TRANSMISSION_TYPE,
  Vehicle,
} from "../../../domain/entities/vehicle";

import { VehicleRepository } from "../../../domain/repositories/vehicle.repository";
import { CreateVehicleDto } from "./create-vehicle.dto";
import { BulkVehicleImagesUseCase } from "../../../vehicle-images/application/bulk-vehicle-images-use-case/bulk-vehicle-images.use-case";
import { ValidateVehicleUseCase } from "../validate-vehicle-use-case/validate-vehicle.use-case";

@Injectable()
export class CreateVehicleUseCase {

  constructor(
    private readonly vehicle_repository: VehicleRepository,
    private readonly bulkVehicleImagesUseCase: BulkVehicleImagesUseCase,
    private readonly validateVehicleUseCase: ValidateVehicleUseCase,
  ) {
  }

  async execute(
    create_vehicle_dto: CreateVehicleDto,
    files: Express.Multer.File[],
  ): Promise<{ vehicle: PrimitiveVehicle }> {
    const { battery_capacity, time_to_charge, autonomy } = create_vehicle_dto;
    const { suggestions } = await this.validateVehicleUseCase.execute({
      battery_capacity: battery_capacity ?? 0,
      time_to_charge: time_to_charge ?? 0,
      autonomy: autonomy ?? 0,
      version_id: create_vehicle_dto.version_id,
      displacement: create_vehicle_dto.displacement ?? 0,
      mileage: create_vehicle_dto.mileage,
      condition: create_vehicle_dto.condition,
    });
    const vehicle = Vehicle.create({
      price: create_vehicle_dto.price,
      mileage: create_vehicle_dto.mileage,
      lat: create_vehicle_dto.lat,
      lng: create_vehicle_dto.lng,
      condition: create_vehicle_dto.condition,
      title: create_vehicle_dto.title,
      description: create_vehicle_dto.description,
      version_id: create_vehicle_dto.version_id,
      publisher_type: create_vehicle_dto.publisher_type,
      transmission_type:
        create_vehicle_dto.transmission_type ?? TRANSMISSION_TYPE.MANUAL,
      traction_id: create_vehicle_dto.traction_id,
      power: create_vehicle_dto.power,
      displacement: create_vehicle_dto.displacement ?? 0,
      autonomy: create_vehicle_dto.autonomy ?? 0,
      battery_capacity: create_vehicle_dto.battery_capacity ?? 0,
      time_to_charge: create_vehicle_dto.time_to_charge ?? 0,
      license_plate: create_vehicle_dto.license_plate ?? "",
      phone_code: create_vehicle_dto.phone_code,
      phone: create_vehicle_dto.phone,
      email: create_vehicle_dto.email,
      features_ids: create_vehicle_dto.features_ids ?? [],
      services_ids: create_vehicle_dto.services_ids ?? [],
      vehicle_type_id: create_vehicle_dto.vehicle_type_id,
      color_id: create_vehicle_dto.color_id ?? null,
      dgt_label_id: create_vehicle_dto.dgt_label_id ?? null,
      warranty_type_id: create_vehicle_dto.warranty_type_id ?? null,
      cuota_id: create_vehicle_dto.cuota_id ?? null,
      suggestions,
    });
    await this.vehicle_repository.save(vehicle);
    if (files.length > 0) {
      await this.bulkVehicleImagesUseCase.execute({
        files,
        vehicle_id: vehicle.toPrimitives().id,
      });
    }
    return { vehicle: vehicle.toPrimitives() };
  }
}
