import { NotFoundException } from "@nestjs/common";

export class VehicleListItemNotFoundException extends NotFoundException {
  constructor(public readonly list_id: string, public readonly vehicle_id: string) {
    super(`El vehículo ${vehicle_id} no está en la lista ${list_id}`);
  }
}
