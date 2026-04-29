

export class NewVehicleMileageException extends Error {
  constructor() {
    super(`New vehicles cannot have a mileage greater than 100000`);
  }
}