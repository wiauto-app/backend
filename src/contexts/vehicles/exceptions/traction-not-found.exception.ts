export class TractionNotFoundException extends Error {
  constructor(public readonly id: string) {
    super(`Tracción con id ${id} no encontrada`);
  }
}
