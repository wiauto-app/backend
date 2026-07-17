import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";

export class CannotChangeOwnerRoleException extends ValidationException {
  constructor() {
    super("No se puede cambiar el rol del propietario");
  }
}
