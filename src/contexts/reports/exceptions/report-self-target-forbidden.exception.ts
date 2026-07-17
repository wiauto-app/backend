import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";

export class ReportSelfTargetForbiddenException extends ValidationException {
  constructor() {
    super("No puedes denunciar tu propio perfil");
  }
}
