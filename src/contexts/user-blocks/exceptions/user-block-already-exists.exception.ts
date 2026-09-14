import { ConflictException } from "@nestjs/common";

export class UserBlockAlreadyExistsException extends ConflictException {
  constructor() {
    super("Ya has bloqueado a este usuario");
  }
}
