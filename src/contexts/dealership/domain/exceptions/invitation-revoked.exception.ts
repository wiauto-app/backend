import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";


export class InvitationRevokedException extends ValidationException {
  constructor() {
    super(`Invitación ha sido revocada`);
  }
}