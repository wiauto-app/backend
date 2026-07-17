import { ForbiddenException } from "@nestjs/common";

export class ReportForbiddenException extends ForbiddenException {
  constructor() {
    super("No tienes permiso para acceder a esta denuncia");
  }
}
