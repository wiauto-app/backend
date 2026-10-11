import { NotFoundException } from "@nestjs/common";

export class VehicleSearchHistoryNotFoundException extends NotFoundException {
  constructor(public readonly id: string) {
    super(`La búsqueda ${id} no existe en tu historial`);
  }
}
