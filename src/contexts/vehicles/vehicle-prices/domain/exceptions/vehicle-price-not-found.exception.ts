import { NotFoundException } from "@nestjs/common";

export class VehiclePriceNotFoundException extends NotFoundException {
  constructor(vehicle_price_id: string, vehicle_id: string) {
    super(
      `Precio con id ${vehicle_price_id} no encontrado para el vehículo ${vehicle_id}`,
    );
  }
}
