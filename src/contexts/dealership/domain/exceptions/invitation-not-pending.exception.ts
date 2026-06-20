import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";

export class InvitationNotPendingException extends ValidationException {
  constructor(public readonly invitation_id: string) {
    super(`La invitación ${invitation_id} no está pendiente`);
  }
}
