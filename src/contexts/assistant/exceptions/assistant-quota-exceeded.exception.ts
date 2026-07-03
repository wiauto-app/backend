import { HttpException, HttpStatus } from "@nestjs/common";

export class AssistantQuotaExceededException extends HttpException {
  constructor() {
    super(
      "No tienes consultas disponibles. Compra un pack para continuar.",
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}
