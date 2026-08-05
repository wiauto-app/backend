import { ConflictException } from "@nestjs/common";

export class DismissedVehicleAlreadyExistsException extends ConflictException {
  constructor() {
    super("Este vehículo ya está descartado");
  }
}
