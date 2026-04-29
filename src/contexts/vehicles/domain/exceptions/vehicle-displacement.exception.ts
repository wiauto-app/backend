

export class VehicleDisplacementException extends Error {
  constructor() {
    super(`Tienes que proporcionar el cilindraje para tu vehículo`);
  }
} 