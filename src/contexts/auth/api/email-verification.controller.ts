import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { Request, Response } from "express";

import { envs } from "@/src/common/envs";

import { EmailVerificationConfirmDto } from "../dto/email-verification-confirm.dto";
import { EmailVerificationResendDto } from "../dto/email-verification-resend.dto";
import { authResponseConfig } from "../response.config";
import { EmailVerificationService } from "../services/email-verification.service";

const ALLOWED_REDIRECT_URLS = (): string[] =>
  [envs.FRONTEND_REDIRECT_URL, envs.FRONTEND_URL]
    .map((url) => url.trim())
    .filter(Boolean);

@Controller("auth/email-verification")
export class EmailVerificationController {
  constructor(private readonly emailVerificationService: EmailVerificationService) {}

  @Get("confirm")
  async confirm(
    @Query() dto: EmailVerificationConfirmDto,
    @Req() request: Request,
    @Res() res: Response,
  ) {
    try {
      const redirectUrl = dto.redirectUrl?.trim();
      if (!redirectUrl) {
        throw new BadRequestException("redirectUrl es obligatorio");
      }

      this.assertAllowedRedirectUrl(redirectUrl);

      const { message, token, refresh_token, type } =
        await this.emailVerificationService.confirm(dto.token, request);

      const url =
        `${redirectUrl}?token=${encodeURIComponent(token)}` +
        `&refresh_token=${encodeURIComponent(refresh_token)}` +
        `&type=${encodeURIComponent(type)}` +
        `&message=${encodeURIComponent(message)}`;

      res.redirect(HttpStatus.FOUND, url);
      return;
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      const loginUrl =
        `${envs.FRONTEND_URL.replace(/\/$/, "")}/iniciar-sesion?error=${encodeURIComponent(errorMessage)}`;
      res.redirect(HttpStatus.FOUND, loginUrl);
    }
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

  private assertAllowedRedirectUrl(redirectUrl: string): void {
    const normalized = redirectUrl.trim();
    if (!ALLOWED_REDIRECT_URLS().includes(normalized)) {
      throw new BadRequestException("La URL de redirección no está permitida");
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
      const response = error.getResponse();
      if (typeof response === "string") {
        return response;
      }
      if (typeof response === "object" && "message" in response) {
        const message = (response as { message: string | string[] }).message;
        return Array.isArray(message) ? message[0] : message;
      }
    }
    return authResponseConfig.messages.EMAIL_VERIFICATION_ERROR;
  }
}
