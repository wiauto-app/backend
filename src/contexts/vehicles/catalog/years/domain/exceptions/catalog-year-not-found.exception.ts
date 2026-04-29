export class CatalogYearNotFoundException extends Error {
  constructor(public readonly id: number) {
    super(`Año catálogo con id ${id} no encontrado`);
  }
}
