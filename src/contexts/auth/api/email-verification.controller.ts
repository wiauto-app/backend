import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";

import { GetUser } from "../decorators/GetUser.decorator";
import { AuthGuard } from "../guards/auth.guard";
import { UserResponse } from "../types/auth.types";
import { EmailVerificationConfirmDto } from "../dto/email-verification-confirm.dto";
import { EmailVerificationService } from "../services/email-verification.service";
import { Response } from "express";

@Controller("auth/email-verification")
export class EmailVerificationController {
  constructor(private readonly emailVerificationService: EmailVerificationService) {}

  @Get("confirm")
  @HttpCode(HttpStatus.OK)
  async confirm(@Query() dto: EmailVerificationConfirmDto, @Res() res: Response) {
    await this.emailVerificationService.confirm(dto.token);
    res.redirect(HttpStatus.FOUND, dto.redirectUrl);
  }

  @Post("resend")
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async resend(@GetUser() session: UserResponse) {
    const { user } = session;

    if (user.provider !== "local") {
      throw new BadRequestException(
        "Las cuentas con inicio de sesión social no requieren verificación por correo.",
      );
    }

    if (user.is_email_verified) {
      throw new BadRequestException("Tu correo ya está verificado.");
    }

    await this.emailVerificationService.enqueueSendVerificationForUser(user.id, user.email);
    return {
      message: "Te enviamos un nuevo correo con el enlace de verificación.",
    };
  }
}
