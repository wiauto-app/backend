import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";

export class InvalidateVehicleVersionIdException extends ValidationException { 
  constructor() {
    super("El id de la versión del vehículo no es válido");
  }
 }