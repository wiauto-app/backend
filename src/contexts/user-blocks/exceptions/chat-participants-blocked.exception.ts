import { ForbiddenException } from "@nestjs/common";

export class ChatParticipantsBlockedException extends ForbiddenException {
  constructor() {
    super("No puedes enviar mensajes a este usuario");
  }
}
