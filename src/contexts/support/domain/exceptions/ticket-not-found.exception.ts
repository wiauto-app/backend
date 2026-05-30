import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";

export class TicketNotFoundException extends ValidationException {
  constructor(public readonly id: string) {
    super(`Ticket con id ${id} no encontrado`);
  }
}
