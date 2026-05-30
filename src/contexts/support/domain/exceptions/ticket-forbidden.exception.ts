import { ForbiddenException } from "@nestjs/common";

export class TicketForbiddenException extends ForbiddenException {
  constructor() {
    super("No tienes permiso para acceder a este ticket");
  }
}
