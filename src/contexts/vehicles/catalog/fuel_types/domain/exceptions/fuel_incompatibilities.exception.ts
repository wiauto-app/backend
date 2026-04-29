

export class FuelIncompatibilitiesException extends Error {
  constructor() {
    super(`Fuel type is not compatible with the given parameters`);
  }
}