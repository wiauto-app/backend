import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CONDITION_VEHICLE, PrimitiveVehicle, Vehicle } from "../../domain/entities/vehicle";

import { VehicleRepository } from "../../domain/repositories/vehicle.repository";
import { CreateVehicleDto } from "./create-vehicle.dto";
import { BulkVehicleImagesUseCase } from "../../vehicle-images/application/bulk-vehicle-images-use-case/bulk-vehicle-images.use-case";
import { CatalogFuelTypesUseCase } from "../../catalog/fuel_types/application/catalog-fuel-types-use-cases/catalog-fuel-types.use-case";
import { FuelIncompatibilitiesException } from "../../catalog/fuel_types/domain/exceptions/fuel_incompatibilities.exception";
import { NewVehicleMileageException } from "../../domain/exceptions/newVehicleMilleage.exception";
import { ElectricDisplacementException } from "../../domain/exceptions/electric-displacement.exception";
import { VehicleDisplacementException } from "../../domain/exceptions/vehicle-displacement.exception";

@Injectable()
export class CreateVehicleUseCase {

  private readonly MAX_MILEAGE_FOR_NEW_VEHICLE: number;
  constructor(
    private readonly vehicle_repository: VehicleRepository,
    private readonly bulk_vehicle_images_use_case: BulkVehicleImagesUseCase,
    private readonly catalog_fuel_types_use_case: CatalogFuelTypesUseCase,
  ) {
    this.MAX_MILEAGE_FOR_NEW_VEHICLE = 1000;
  }

  async execute(
    create_vehicle_dto: CreateVehicleDto,
    files: Express.Multer.File[],
  ): Promise<{ vehicle: PrimitiveVehicle, suggestions: string[] }> {
    const suggestions: string[] = [];
    const { battery_capacity, time_to_charge, autonomy } = create_vehicle_dto;
    const { fuel_type } = await this.catalog_fuel_types_use_case.findOne(create_vehicle_dto.fuel_type_id);

    //Si el tipo de combustible no soporta carga y se ha proporcionado capacidad de batería, autonomía y tiempo de carga, se lanza una excepción.
    if (!fuel_type.can_charge && (battery_capacity > 0 || autonomy > 0 || time_to_charge > 0)) {
      throw new FuelIncompatibilitiesException();
    }

    if (create_vehicle_dto.mileage > this.MAX_MILEAGE_FOR_NEW_VEHICLE && create_vehicle_dto.condition === CONDITION_VEHICLE.NEW) {
      throw new NewVehicleMileageException();
    }
    if (create_vehicle_dto.mileage < this.MAX_MILEAGE_FOR_NEW_VEHICLE && create_vehicle_dto.condition === CONDITION_VEHICLE.USED) {
      suggestions.push("Tu vehículo tiene menos de 1000 km, podrías considerarlo como nuevo para obtener una mejor visibilidad en la plataforma.");
    }

    if (fuel_type.can_charge && create_vehicle_dto.displacement > 0) {
      throw new ElectricDisplacementException();
    }
    if (!fuel_type.can_charge && create_vehicle_dto.displacement <= 0) {
      throw new VehicleDisplacementException();
    }

    //TODO: agregar validación de precio con IA para mostrar error si es absurdo o si es un poco bajo del mercado muestra la sugerencia

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
    return { vehicle: vehicle.toPrimitives(), suggestions };
  }
}
