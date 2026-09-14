import { BadRequestException } from "@nestjs/common";

export class UserBlockSelfForbiddenException extends BadRequestException {
  constructor() {
    super("No puedes bloquearte a ti mismo");
  }
}
