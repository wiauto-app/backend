import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";


export class InvitationAlreadyAcceptedException extends ValidationException {
  constructor() {
    super(`Invitación ya ha sido aceptada`);
  }
}