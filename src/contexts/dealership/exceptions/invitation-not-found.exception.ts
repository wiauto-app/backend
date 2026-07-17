import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";



export class InvitationNotFoundException extends ValidationException {
  constructor(public readonly token_hash: string) {
    super(`Invitación con token hash ${token_hash} no encontrada`);
  }
}