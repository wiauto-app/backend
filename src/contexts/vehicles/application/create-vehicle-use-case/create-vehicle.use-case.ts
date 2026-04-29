import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PrimitiveVehicle, Vehicle } from "../../domain/entities/vehicle";

import { VehicleRepository } from "../../domain/repositories/vehicle.repository";
import { CreateVehicleDto } from "./create-vehicle.dto";
import { BulkVehicleImagesUseCase } from "../../vehicle-images/application/bulk-vehicle-images-use-case/bulk-vehicle-images.use-case";
import { CatalogFuelTypesUseCase } from "../../catalog/fuel_types/application/catalog-fuel-types-use-cases/catalog-fuel-types.use-case";
import { FuelIncompatibilitiesException } from "../../catalog/fuel_types/domain/exceptions/fuel_incompatibilities.exception";

@Injectable()
export class CreateVehicleUseCase {

  private readonly MAX_MILEAGE_FOR_NEW_VEHICLE = 100000;
  constructor(
    private readonly vehicle_repository: VehicleRepository,
    private readonly bulk_vehicle_images_use_case: BulkVehicleImagesUseCase,
    private readonly catalog_fuel_types_use_case: CatalogFuelTypesUseCase,
  ) { }

  async execute(
    create_vehicle_dto: CreateVehicleDto,
    files: Express.Multer.File[],
  ): Promise<{ vehicle: PrimitiveVehicle }> {
    const { battery_capacity, time_to_charge, autonomy } = create_vehicle_dto;
    const { fuel_type } = await this.catalog_fuel_types_use_case.findOne(create_vehicle_dto.fuel_type_id);

    //Si el tipo de combustible no soporta carga y se ha proporcionado capacidad de batería, autonomía y tiempo de carga, se lanza una excepción.
    if (!fuel_type.can_charge && battery_capacity && autonomy && time_to_charge) {
      throw new FuelIncompatibilitiesException();
    }

    // if(create_vehicle_dto.mileage  > this.MAX_MILEAGE_FOR_NEW_VEHICLE && create_vehicle_dto.condition === 'new') {
    //   throw new MileageException();
    // }


    const vehicle = Vehicle.create({
      ...create_vehicle_dto,
      features_ids: create_vehicle_dto.features_ids ?? [],
      services_ids: create_vehicle_dto.services_ids ?? [],
      vehicle_type_id: create_vehicle_dto.vehicle_type_id,
      color_id: create_vehicle_dto.color_id,
      dgt_label_id: create_vehicle_dto.dgt_label_id,
      warranty_type_id: create_vehicle_dto.warranty_type_id,
    });
    await this.vehicle_repository.save(vehicle);
    await this.bulk_vehicle_images_use_case.execute({
      files,
      vehicle_id: vehicle.toPrimitives().id,
    });
    return { vehicle: vehicle.toPrimitives() };
  }
}
