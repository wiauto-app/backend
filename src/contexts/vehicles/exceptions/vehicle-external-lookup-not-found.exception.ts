import { NotFoundException } from "@nestjs/common";

export class VehicleExternalLookupNotFoundException extends NotFoundException {
  constructor() {
    super("No se encontró un vehículo con los datos proporcionados");
  }
}
