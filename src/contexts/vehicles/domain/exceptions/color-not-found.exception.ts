export class ColorNotFoundException extends Error {
  constructor(public readonly id: string) {
    super(`Color con id ${id} no encontrado`);
  }
}
