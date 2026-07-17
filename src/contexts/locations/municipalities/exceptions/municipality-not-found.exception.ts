export class MunicipalityNotFoundException extends Error {
  constructor(public readonly id: string | number) {
    super(`Municipio con id ${id} no encontrado`);
  }
}
