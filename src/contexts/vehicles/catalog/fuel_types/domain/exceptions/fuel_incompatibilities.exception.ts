import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";


export class FuelIncompatibilitiesException extends ValidationException {
  constructor() {
    super(`El tipo de combustible no admite carga y no puede indicarse batería, autonomía o tiempo de carga.`); 
  }
}