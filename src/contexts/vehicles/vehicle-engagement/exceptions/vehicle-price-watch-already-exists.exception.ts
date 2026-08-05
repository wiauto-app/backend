import { ConflictException } from "@nestjs/common";

export class VehiclePriceWatchAlreadyExistsException extends ConflictException {
  constructor() {
    super("Ya tienes una alerta de bajada de precio para este vehículo");
  }
}
