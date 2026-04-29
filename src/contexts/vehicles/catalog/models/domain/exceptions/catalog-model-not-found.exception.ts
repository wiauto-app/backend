export class CatalogModelNotFoundException extends Error {
  constructor(public readonly id: number) {
    super(`Modelo con id ${id} no encontrado`);
  }
}
