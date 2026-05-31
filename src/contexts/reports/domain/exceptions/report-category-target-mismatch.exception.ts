import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";

export class ReportCategoryTargetMismatchException extends ValidationException {
  constructor() {
    super(
      "La categoría de denuncia no corresponde al tipo de objetivo indicado",
    );
  }
}
