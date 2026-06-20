import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";

export class CannotRemoveOwnerException extends ValidationException {
  constructor() {
    super("No se puede eliminar al único propietario del concesionario");
  }
}
