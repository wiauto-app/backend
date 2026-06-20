import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";

export class DealershipMemberNotFoundException extends ValidationException {
  constructor(public readonly member_id: string) {
    super(`Miembro ${member_id} no encontrado`);
  }
}
