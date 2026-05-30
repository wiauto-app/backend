import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";

export class ProfileNotFoundForMemberException extends ValidationException {
  constructor(public readonly profile_id: string) {
    super(`No se encontró el perfil ${profile_id} para el miembro del concesionario`);
  }
}
