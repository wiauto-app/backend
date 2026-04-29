export class CatalogFuelTypeNotFoundException extends Error {
  constructor(public readonly id: number) {
    super(`Tipo de combustible con id ${id} no encontrado`);
  }
}
