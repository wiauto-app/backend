import { InternalServerErrorException } from "@nestjs/common";

export class VehicleExternalLookupConfigException extends InternalServerErrorException {
  constructor() {
    super("La identificación de vehículos no está configurada correctamente");
  }
}
