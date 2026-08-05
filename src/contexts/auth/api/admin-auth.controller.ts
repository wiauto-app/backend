import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { Request, Response } from "express";

import { TwofaDto } from "../../2fa/dto/2fa.dto";
import {
  ADMIN_ACCESS_TOKEN_NAME,
  ADMIN_REFRESH_TOKEN_NAME,
  adminAuthCookieConfig,
} from "../admin-cookie.config";
import {
  ACCESS_TOKEN_NAME,
  REFRESH_TOKEN_NAME,
  authCookieConfig,
} from "../cookie.config";
import { GetRefreshToken } from "../decorators/GetRefreshToken.decorator";
import { GetSessionId } from "../decorators/GetSessionId.decorator";
import { GetSessionPayload } from "../decorators/GetSessionPayload.decorator";
import { PasswordRecoveryChangeDto } from "../dto/password-recovery-change.dto";
import { PasswordRecoveryRequestDto } from "../dto/password-recovery-request.dto";
import { LoginDto } from "../dto/login.dto";
import { VerifyBackupCodeLoginHttpDto } from "../dto/verify-backup-code-login.http-dto";
import { JwtGuard } from "../guards/auth.guard";
import { RefreshTokenGuard } from "../guards/refresh-token.guard";
import { TwoFactorChallengeScopeGuard } from "../guards/two-factor-challenge-scope.guard";
import { AdminLoginService } from "../services/admin-login.service";
import { PasswordRecoveryService } from "../services/password-recovery.service";
import { TwoFactorLoginService } from "../services/two-factor-login.service";
import type { SessionPayload } from "../types/auth.types";

@Controller("auth/admin")
export class AdminAuthController {
  constructor(
    private readonly admin_login_service: AdminLoginService,
    private readonly two_factor_login_service: TwoFactorLoginService,
    private readonly password_recovery_service: PasswordRecoveryService,
  ) {}

  private setAdminSessionCookies(
    res: Response,
    tokens: { token: string; refresh_token: string },
  ): void {
    res.cookie(
      ADMIN_REFRESH_TOKEN_NAME,
      tokens.refresh_token,
      adminAuthCookieConfig.refresh_token,
    );
    res.cookie(
      ADMIN_ACCESS_TOKEN_NAME,
      tokens.token,
      adminAuthCookieConfig.access_token,
    );
  }

  private setAdminAccessCookie(res: Response, token: string): void {
    res.cookie(
      ADMIN_ACCESS_TOKEN_NAME,
      token,
      adminAuthCookieConfig.access_token,
    );
  }

  /** Limpia cookies admin nuevas y las legacy que compartían nombre con la plataforma. */
  private clearAdminCookies(res: Response): void {
    res.clearCookie(
      ADMIN_REFRESH_TOKEN_NAME,
      adminAuthCookieConfig.refresh_token,
    );
    res.clearCookie(
      ADMIN_ACCESS_TOKEN_NAME,
      adminAuthCookieConfig.access_token,
    );
    res.clearCookie(REFRESH_TOKEN_NAME, authCookieConfig.refresh_token);
    res.clearCookie(ACCESS_TOKEN_NAME, authCookieConfig.access_token);
  }

  @Post("login")
  async adminLogin(
    @Body() admin_login_dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.admin_login_service.signIn({
      adminLoginDto: admin_login_dto,
      request: req,
    });

    this.setAdminSessionCookies(res, {
      token: result.token,
      refresh_token: result.refresh_token,
    });

    return {
      message: "Login successful",
      data: {
        type: result.type === "2fa_challenge" ? "2fa_required" : "session",
        email: admin_login_dto.email,
      },
    };
  }

  @Get("two-factor/challenge")
  @UseGuards(JwtGuard, TwoFactorChallengeScopeGuard)
  getAdminTwoFactorChallenge(
    @GetSessionPayload() session_payload: SessionPayload,
  ) {
    return this.two_factor_login_service.getChallengeStatus(
      session_payload.email,
    );
  }

  @Post("verify-2fa")
  @UseGuards(JwtGuard, TwoFactorChallengeScopeGuard)
  async verifyAdminTwoFactorLogin(
    @GetSessionPayload() session_payload: SessionPayload,
    @Body() twofa_dto: TwofaDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.two_factor_login_service.verifyTotpChallenge(
      session_payload.id,
      twofa_dto,
      session_payload,
    );

    this.setAdminAccessCookie(res, result.token);

    return {
      message: "Verificación completada correctamente",
      data: { type: result.type, token: result.token },
    };
  }

  @Post("verify-backup-code")
  @UseGuards(JwtGuard, TwoFactorChallengeScopeGuard)
  async verifyAdminBackupCodeLogin(
    @GetSessionPayload() session_payload: SessionPayload,
    @Body() verify_backup_code_login_http_dto: VerifyBackupCodeLoginHttpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result =
      await this.two_factor_login_service.verifyBackupCodeChallenge(
        session_payload.id,
        verify_backup_code_login_http_dto.code.toUpperCase(),
        session_payload,
      );

    this.setAdminAccessCookie(res, result.token);

    return {
      message: "Código de respaldo validado correctamente",
      data: { type: result.type, token: result.token },
    };
  }

  @Post("logout")
  @UseGuards(JwtGuard)
  async adminLogout(
    @Res({ passthrough: true }) res: Response,
    @GetSessionId() session_id: string,
  ) {
    await this.admin_login_service.logout(session_id);
    this.clearAdminCookies(res);
    return {
      message: "Logout successful",
    };
  }

  @Post("refresh")
  @UseGuards(RefreshTokenGuard)
  async adminRefreshToken(
    @GetRefreshToken() refresh_token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.admin_login_service.refresh(refresh_token);
    this.setAdminSessionCookies(res, {
      token: result.token,
      refresh_token: result.refresh_token,
    });
    return result;
  }

  @Post("password-recovery/request")
  async adminPasswordRecoveryRequest(
    @Body() dto: PasswordRecoveryRequestDto,
  ) {
    await this.password_recovery_service.requestAdminRecovery(
      dto.email,
      dto.redirect_url,
    );
    return {
      message:
        "Si el email está registrado, vas a recibir un correo con instrucciones.",
    };
  }

  @Post("password-recovery/change")
  async adminPasswordRecoveryChange(@Body() dto: PasswordRecoveryChangeDto) {
    await this.password_recovery_service.changeAdminPassword(
      dto.token,
      dto.password,
    );
    return {
      message: "Contraseña actualizada correctamente.",
    };
  }
}
