import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";


export class InvitationExpiredException extends ValidationException {
  constructor() {
    super(`Invitación ha expirado`);
  }
}