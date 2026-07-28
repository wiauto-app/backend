import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";

export class AppraisalRequestNotFoundException extends ValidationException {
  constructor(public readonly id: string) {
    super(`Solicitud de tasación con id ${id} no encontrada`);
  }
}
