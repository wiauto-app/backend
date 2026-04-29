export class DgtLabelNotFoundException extends Error {
  constructor(public readonly id: string) {
    super(`Etiqueta DGT con id ${id} no encontrada`);
  }
}
