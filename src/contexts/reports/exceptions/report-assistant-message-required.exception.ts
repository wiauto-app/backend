import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";

export class ReportAssistantMessageRequiredException extends ValidationException {
  constructor() {
    super("Debes indicar el identificador del mensaje del asistente");
  }
}
