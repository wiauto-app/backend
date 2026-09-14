import { NotFoundException } from "@nestjs/common";

export class UserBlockTargetNotFoundException extends NotFoundException {
  constructor() {
    super("No se encontró el perfil a bloquear");
  }
}
