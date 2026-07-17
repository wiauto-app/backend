import { HttpException, HttpStatus } from "@nestjs/common";

export class VehicleExternalLookupRateLimitedException extends HttpException {
  constructor() {
    super(
      "Se alcanzó el límite de consultas de identificación de vehículos",
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
