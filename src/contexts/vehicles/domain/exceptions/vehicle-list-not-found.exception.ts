import { NotFoundException } from "@nestjs/common";

export class VehicleListNotFoundException extends NotFoundException {
  constructor(public readonly id: string) {
    super(`Lista con id ${id} no encontrada`);
  }
}
