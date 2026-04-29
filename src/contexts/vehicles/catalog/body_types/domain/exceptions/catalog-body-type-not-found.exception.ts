export class CatalogBodyTypeNotFoundException extends Error {
  constructor(public readonly id: number) {
    super(`Tipo de carrocería con id ${id} no encontrado`);
  }
}
