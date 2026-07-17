import { ForbiddenException } from "@nestjs/common";

export class AlertForbiddenException extends ForbiddenException {
  constructor() {
    super("No tienes permiso para acceder a esta alerta");
  }
}
