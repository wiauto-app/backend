import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";


export class NewVehicleMileageException extends ValidationException {
  constructor() {
    super(`Los vehículos nuevos no pueden tener más de 1000 km`);
  }
}