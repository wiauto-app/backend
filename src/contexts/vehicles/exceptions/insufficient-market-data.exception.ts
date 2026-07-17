import { ConflictException } from "@nestjs/common";

export class InsufficientMarketDataException extends ConflictException {
  constructor() {
    super(
      "No hay suficientes anuncios similares en la plataforma para recomendar un precio fiable",
    );
  }
}
