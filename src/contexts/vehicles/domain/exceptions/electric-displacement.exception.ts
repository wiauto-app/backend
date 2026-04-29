

export class ElectricDisplacementException extends Error {
  constructor() {
    super(`Electric vehicles cannot have a displacement greater than 0`);
  }
}