import { NotFoundException } from "@nestjs/common";

export class VehiclePriceWatchNotFoundException extends NotFoundException {
  constructor(public readonly vehicle_id: string) {
    super(`No hay alerta de bajada de precio para el vehículo ${vehicle_id}`);
  }
}
