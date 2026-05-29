import { ConflictException } from "@nestjs/common";


export class ChatAlreadyExistsException extends ConflictException {
  constructor() {
    super(`Ya existe un chat`);
  }
}