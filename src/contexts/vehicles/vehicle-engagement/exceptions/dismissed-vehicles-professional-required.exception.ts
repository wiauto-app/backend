import { ForbiddenException } from "@nestjs/common";

export class DismissedVehiclesProfessionalRequiredException extends ForbiddenException {
  constructor() {
    super("Solo los profesionales pueden listar vehículos descartados");
  }
}
