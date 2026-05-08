import { ConflictException } from "@nestjs/common";

export class ProfileAlreadyExistsException extends ConflictException {
  constructor(public readonly id: string) {
    super(`Ya existe un perfil para el usuario ${id}`);
  }
}
