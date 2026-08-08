import { ForbiddenException } from "@nestjs/common";

export class DismissedVehiclesEntitlementRequiredException extends ForbiddenException {
  constructor() {
    super(
      "Tu plan no incluye la gestión de vehículos descartados",
    );
  }
}
