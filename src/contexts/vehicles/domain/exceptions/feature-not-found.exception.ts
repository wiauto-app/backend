export class FeatureNotFoundException extends Error {
  constructor(public readonly id: string) {
    super(`Característica con id ${id} no encontrada`);
  }
}