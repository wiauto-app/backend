export class InvalidVehicleFeatureIdsException extends Error {
  constructor(readonly feature_ids: string[]) {
    super(`Identificadores de feature inexistentes: ${feature_ids.join(", ")}`);
    this.name = "InvalidVehicleFeatureIdsException";
  }
}
