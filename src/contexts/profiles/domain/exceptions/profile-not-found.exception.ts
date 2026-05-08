import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";

export class ProfileNotFoundException extends ValidationException {
  constructor(public readonly id: string) {
    super(`Perfil con id ${id} no encontrado`);
  }
}
