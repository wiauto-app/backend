import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";

export class InvalidDealershipMembersException extends ValidationException {
  constructor(message: string) {
    super(message);
  }
}
