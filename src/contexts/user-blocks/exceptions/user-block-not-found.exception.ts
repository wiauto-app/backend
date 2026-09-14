import { NotFoundException } from "@nestjs/common";

export class UserBlockNotFoundException extends NotFoundException {
  constructor() {
    super("No se encontró el bloqueo");
  }
}
