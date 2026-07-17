export class CommunityNotFoundException extends Error {
  constructor(public readonly id: string | number) {
    super(`Comunidad con id ${id} no encontrada`);
  }
}
