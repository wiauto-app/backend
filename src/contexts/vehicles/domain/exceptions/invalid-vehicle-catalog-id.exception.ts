export class InvalidVehicleCatalogIdException extends Error {
  constructor(
    public readonly field: string,
    public readonly id: string,
  ) {
    super(`${field} no corresponde a un registro existente: ${id}`);
    this.name = "InvalidVehicleCatalogIdException";
  }
}
