import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { CatalogFuelTypeNotFoundException } from "../../../catalog/fuel_types/domain/exceptions/catalog-fuel-type-not-found.exception";
import { FuelIncompatibilitiesException } from "../../../catalog/fuel_types/domain/exceptions/fuel_incompatibilities.exception";
import { CatalogFuelTypesRepository } from "../../../catalog/fuel_types/domain/repositories/catalog-fuel-types.repository";
import { CatalogVersionsRepository } from "../../../catalog/versions/domain/repositories/catalog-versions.repository";
import {
  CONDITION_VEHICLE,
  ConditionVehicle,
} from "../../../domain/entities/vehicle";
import { ElectricDisplacementException } from "../../../domain/exceptions/electric-displacement.exception";
import { InvalidateVehicleVersionIdException } from "../../../domain/exceptions/InvalidateVehicleVersionId.exception";
import { NewVehicleMileageException } from "../../../domain/exceptions/newVehicleMilleage.exception";
import { VehicleDisplacementException } from "../../../domain/exceptions/vehicle-displacement.exception";

export interface ValidateVehicleInput {
  battery_capacity: number;
  time_to_charge: number;
  autonomy: number;
  version_id: number;
  displacement: number;
  mileage: number;
  condition: ConditionVehicle;
}

@Injectable()
export class ValidateVehicleUseCase {
  private readonly MAX_MILEAGE_FOR_NEW_VEHICLE: number;
  constructor(
    private readonly catalogVersionsRepository: CatalogVersionsRepository,
    private readonly catalogFuelTypesRepository: CatalogFuelTypesRepository,
  ) {
    this.MAX_MILEAGE_FOR_NEW_VEHICLE = 1000;
  }

  async execute(
    input: ValidateVehicleInput,
  ): Promise<{ suggestions: string[] }> {
    const suggestions: string[] = [];
    const {
      battery_capacity,
      time_to_charge,
      autonomy,
      version_id,
      displacement,
      mileage,
      condition,
    } = input;

    if (!Number.isInteger(version_id) || version_id < 1) {
      throw new InvalidateVehicleVersionIdException();
    }

    const version = await this.catalogVersionsRepository.findOne(version_id);
    if (!version) {
      throw new InvalidateVehicleVersionIdException();
    }

    const fuel_type_id = version.toPrimitives().fuel_type_id;
    const fuel_type = await this.catalogFuelTypesRepository.findOne(fuel_type_id);
    if (!fuel_type) {
      throw new CatalogFuelTypeNotFoundException(fuel_type_id);
    }

    const can_charge = fuel_type.toPrimitives().can_charge;

    if (
      !can_charge &&
      (battery_capacity > 0 || autonomy > 0 || time_to_charge > 0)
    ) {
      throw new FuelIncompatibilitiesException();
    }

    if (
      mileage > this.MAX_MILEAGE_FOR_NEW_VEHICLE &&
      condition === CONDITION_VEHICLE.NEW
    ) {
      throw new NewVehicleMileageException();
    }
    if (
      mileage < this.MAX_MILEAGE_FOR_NEW_VEHICLE &&
      condition === CONDITION_VEHICLE.USED
    ) {
      suggestions.push(
        "Tu vehículo tiene menos de 1000 km, podrías considerarlo como nuevo para obtener una mejor visibilidad en la plataforma.",
      );
    }

    if (can_charge && displacement > 0) {
      throw new ElectricDisplacementException();
    }
    if (!can_charge && displacement <= 0) {
      throw new VehicleDisplacementException();
    }

    return { suggestions };
  }
}
