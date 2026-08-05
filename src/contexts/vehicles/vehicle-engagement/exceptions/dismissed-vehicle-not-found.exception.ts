import { NotFoundException } from "@nestjs/common";

export class DismissedVehicleNotFoundException extends NotFoundException {
  constructor(public readonly vehicle_id: string) {
    super(`El vehículo ${vehicle_id} no está en descartados`);
  }
}
