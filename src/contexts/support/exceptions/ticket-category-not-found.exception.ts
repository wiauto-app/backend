import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";

export class TicketCategoryNotFoundException extends ValidationException {
  constructor(public readonly id: string) {
    super(`Categoría de ticket con id ${id} no encontrada`);
  }
}
