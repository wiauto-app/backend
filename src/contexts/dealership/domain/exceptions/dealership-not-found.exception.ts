import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";

export class DealershipNotFoundException extends ValidationException {
  constructor(public readonly id: string) {
    super(`Concesionario con id ${id} no encontrado`);
  }
}
