

export class VehicleTypeNotFoundException extends Error {
  constructor(public readonly id: string) {
    super(`Vehículo con id ${id} no encontrado`);
  }
}