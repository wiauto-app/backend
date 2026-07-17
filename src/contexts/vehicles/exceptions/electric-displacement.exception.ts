import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";


export class ElectricDisplacementException extends ValidationException {
  constructor() {
    super(`Los vehículos eléctricos no pueden tener cilindrada.`);
  }
}