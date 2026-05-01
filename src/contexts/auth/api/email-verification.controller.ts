import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
} from "@nestjs/common";

import { EmailVerificationConfirmDto } from "../dto/email-verification-confirm.dto";
import { EmailVerificationResendDto } from "../dto/email-verification-resend.dto";
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
  async resend(@Body() dto: EmailVerificationResendDto) {
    await this.emailVerificationService.enqueueResendVerificationIfEligible(dto.email);
    return {
      message:
        "Si ese correo tiene una cuenta local pendiente de verificación, te enviamos un nuevo enlace.",
    };
  }
}
