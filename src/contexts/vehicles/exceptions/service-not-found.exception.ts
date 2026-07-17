export class ServiceNotFoundException extends Error {
  constructor(public readonly id: string) {
    super(`Servicio con id ${id} no encontrado`);
  }
}
