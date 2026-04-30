import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";

export class VehicleDisplacementException extends ValidationException {
  constructor() {
    super(`Tienes que proporcionar el cilindraje para tu vehículo.`);
  }
} 