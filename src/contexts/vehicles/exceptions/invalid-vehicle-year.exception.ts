import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";

export class InvalidVehicleYearException extends ValidationException {
  constructor() {
    super("El año seleccionado no corresponde a la versión del vehículo");
  }
}
