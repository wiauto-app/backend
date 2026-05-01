export class CuotaNotFoundException extends Error {
  constructor(public readonly id: string) {
    super(`Cuota con id ${id} no encontrada`);
  }
}
