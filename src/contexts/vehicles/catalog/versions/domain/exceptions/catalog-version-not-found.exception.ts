export class CatalogVersionNotFoundException extends Error {
  constructor(public readonly id: number) {
    super(`Versión (catálogo) con id ${id} no encontrada`);
  }
}
