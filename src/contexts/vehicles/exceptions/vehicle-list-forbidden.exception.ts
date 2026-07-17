import { ForbiddenException } from "@nestjs/common";

export class VehicleListForbiddenException extends ForbiddenException {
  constructor() {
    super("No tienes permiso para acceder a esta lista");
  }
}
