import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";

import { PasswordRecoveryChangeDto } from "../dto/password-recovery-change.dto";
import { PasswordRecoveryRequestDto } from "../dto/password-recovery-request.dto";
import { PasswordRecoveryService } from "../services/password-recovery.service";

@Controller("/auth/password-recovery")
export class PasswordRecoveryController {
  constructor(private readonly passwordRecoveryService: PasswordRecoveryService) {}

  @Post("request")
  @HttpCode(HttpStatus.OK)
  async request(@Body() dto: PasswordRecoveryRequestDto) {
    await this.passwordRecoveryService.requestRecovery(dto.email);
    return {
      message: "Si el email está registrado, vas a recibir un correo con instrucciones.",
    };
  }

  @Post("change")
  @HttpCode(HttpStatus.OK)
  async change(@Body() dto: PasswordRecoveryChangeDto) {
    await this.passwordRecoveryService.changePassword(dto.token, dto.password);
    return {
      message: "Contraseña actualizada correctamente.",
    };
  }
}
