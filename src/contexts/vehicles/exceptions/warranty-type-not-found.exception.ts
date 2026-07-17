export class WarrantyTypeNotFoundException extends Error {
  constructor(public readonly id: string) {
    super(`Tipo de garantía con id ${id} no encontrado`);
  }
}
