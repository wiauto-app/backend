import { NotFoundException } from "@nestjs/common";

export class AlertNotFoundException extends NotFoundException {
  constructor(public readonly id: string) {
    super(`Alerta con id ${id} no encontrada`);
  }
}
