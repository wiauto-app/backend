export class ProvinceNotFoundException extends Error {
  constructor(public readonly id: string | number) {
    super(`Provincia con id ${id} no encontrada`);
  }
}
