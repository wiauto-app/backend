export class MakeNotFoundException extends Error {
  constructor(public readonly id: number) {
    super(`Marca con id ${id} no encontrada`);
  }
}
