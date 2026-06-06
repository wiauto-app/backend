import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";


export class VehicleNotFoundException extends ValidationException {
  constructor(public readonly id:string) {
    super(`Vehículo con id ${id} no encontrado`);
  }
}