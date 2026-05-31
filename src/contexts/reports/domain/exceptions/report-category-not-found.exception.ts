import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";

export class ReportCategoryNotFoundException extends ValidationException {
  constructor(public readonly id: string) {
    super(`Categoría de denuncia con id ${id} no encontrada`);
  }
}
