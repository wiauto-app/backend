import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";

export class ReportNotFoundException extends ValidationException {
  constructor(public readonly id: string) {
    super(`Denuncia con id ${id} no encontrada`);
  }
}
