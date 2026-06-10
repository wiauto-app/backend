import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import {
  PrimitiveVehicle,
  STATUS_VEHICLE,
  TRANSMISSION_TYPE,
  Vehicle,
} from "../../../domain/entities/vehicle";

import { VehicleRepository } from "../../../domain/repositories/vehicle.repository";
import { CreateVehicleDto } from "./create-vehicle.dto";
import { AttachVehicleImagesFromTempUseCase } from "../../../vehicle-images/application/attach-vehicle-images-from-temp-use-case/attach-vehicle-images-from-temp.use-case";
import { SetVehiclePriceUseCase } from "../../../vehicle-prices/application/set-vehicle-price-use-case/set-vehicle-price.use-case";
import { ValidateVehicleUseCase } from "../validate-vehicle-use-case/validate-vehicle.use-case";
import { VehicleSearchIndexer } from "../../../search/infrastructure/indexing/vehicle-search-indexer.service";

@Injectable()
export class CreateVehicleUseCase {

  constructor(
    private readonly vehicle_repository: VehicleRepository,
    private readonly attach_vehicle_images_from_temp_use_case: AttachVehicleImagesFromTempUseCase,
    private readonly validateVehicleUseCase: ValidateVehicleUseCase,
    private readonly set_vehicle_price_use_case: SetVehiclePriceUseCase,
    private readonly vehicle_search_indexer: VehicleSearchIndexer,
  ) {
  }

  async execute(
    create_vehicle_dto: CreateVehicleDto,
    publisher_profile_id: string,
  ): Promise<{ vehicle: PrimitiveVehicle }> {
    const { battery_capacity, time_to_charge, autonomy } = create_vehicle_dto;
    const { suggestions } = await this.validateVehicleUseCase.execute({
      battery_capacity: battery_capacity ?? 0,
      time_to_charge: time_to_charge ?? 0,
      autonomy: autonomy ?? 0,
      version_id: create_vehicle_dto.version_id,
      displacement: create_vehicle_dto.displacement,
      mileage: create_vehicle_dto.mileage,
      condition: create_vehicle_dto.condition,
    });
    const vehicle = Vehicle.create({
      vin_code: create_vehicle_dto.vin_code ?? "",
      profile_id: publisher_profile_id,
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
      power: create_vehicle_dto.power ?? 0,
      displacement: create_vehicle_dto.displacement,
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
      category_id: create_vehicle_dto.category_id ?? null,
      color_id: create_vehicle_dto.color_id ?? null,
      dgt_label_id: create_vehicle_dto.dgt_label_id ?? null,
      warranty_type_id: create_vehicle_dto.warranty_type_id ?? null,
      cuota_ids: create_vehicle_dto.cuota_ids ?? [],
      suggestions,
    });
    await this.vehicle_repository.save(vehicle);

    await this.set_vehicle_price_use_case.execute({
      vehicle_id: vehicle.toPrimitives().id,
      price: create_vehicle_dto.price,
    });

    if (create_vehicle_dto.images && create_vehicle_dto.images.length > 0) {
      await this.attach_vehicle_images_from_temp_use_case.execute({
        vehicle_id: vehicle.toPrimitives().id,
        images: create_vehicle_dto.images,
      });
    }

    await this.vehicle_search_indexer.syncVehicle(
      vehicle.toPrimitives().id,
      STATUS_VEHICLE.PENDING,
    );

    return { vehicle: vehicle.toPrimitives() };
  }
}
