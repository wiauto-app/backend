import { FuelIncompatibilitiesException } from "../catalog/fuel_types/exceptions/fuel_incompatibilities.exception";
import { ElectricDisplacementException } from "../exceptions/electric-displacement.exception";
import { NewVehicleMileageException } from "../exceptions/newVehicleMilleage.exception";
import {
  CONDITION_VEHICLE,
  type ConditionVehicle,
} from "../types/vehicle";

const MAX_MILEAGE_FOR_NEW_VEHICLE = 1000;

interface ValidateVehicleCreationRulesInput {
  battery_capacity: number;
  time_to_charge: number;
  autonomy: number;
  displacement: number;
  mileage: number;
  condition: ConditionVehicle;
  can_charge: boolean;
}

export function validateVehicleCreationRules(
  input: ValidateVehicleCreationRulesInput,
): string[] {
  if (
    !input.can_charge &&
    (input.battery_capacity > 0 ||
      input.autonomy > 0 ||
      input.time_to_charge > 0)
  ) {
    throw new FuelIncompatibilitiesException();
  }

  if (
    input.mileage > MAX_MILEAGE_FOR_NEW_VEHICLE &&
    input.condition === CONDITION_VEHICLE.NEW
  ) {
    throw new NewVehicleMileageException();
  }

  const suggestions: string[] = [];
  if (
    input.mileage < MAX_MILEAGE_FOR_NEW_VEHICLE &&
    input.condition === CONDITION_VEHICLE.USED
  ) {
    suggestions.push(
      "Tu vehículo tiene menos de 1000 km, podrías considerarlo como nuevo para obtener una mejor visibilidad en la plataforma.",
    );
  }

  if (input.can_charge && input.displacement > 0) {
    throw new ElectricDisplacementException();
  }

  return suggestions;
}
