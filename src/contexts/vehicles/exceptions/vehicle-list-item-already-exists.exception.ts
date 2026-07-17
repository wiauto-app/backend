import { ConflictException } from "@nestjs/common";

export class VehicleListItemAlreadyExistsException extends ConflictException {
  constructor() {
    super("El vehículo ya está en esta lista");
  }
}
