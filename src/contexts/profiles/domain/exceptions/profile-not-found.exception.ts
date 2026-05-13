import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";

export class ProfileNotFoundException extends ValidationException {
  constructor(public readonly reference: string) {
    super(`Perfil ${reference} no encontrado`);
  }
}
