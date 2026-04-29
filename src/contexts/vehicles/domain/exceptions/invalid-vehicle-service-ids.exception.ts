export class InvalidVehicleServiceIdsException extends Error {
  constructor(readonly service_ids: string[]) {
    super(`Identificadores de servicio inexistentes: ${service_ids.join(", ")}`);
    this.name = "InvalidVehicleServiceIdsException";
  }
}
