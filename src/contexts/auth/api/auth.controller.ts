import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { Request, Response } from "express";

import { AuthService } from "../services/auth.service";
import { LoginDto } from "../dto/login.dto";
import { GoogleMobileDto } from "../dto/google-mobile.dto";
import { GoogleAuthGuard } from "../guards/google-auth.guard";
import { GoogleTokenService } from "../services/google-token.service";
import { OAuthProfile } from "../strategies/google.strategy";
import { JwtGuard } from "../guards/auth.guard";
import { RefreshTokenGuard } from "../guards/refresh-token.guard";
import { GetRefreshToken } from "../decorators/GetRefreshToken.decorator";
import { AdminLoginService } from "../services/admin-login.service";
import { TwoFactorLoginService } from "../services/two-factor-login.service";
import { ACCESS_TOKEN_NAME, authCookieConfig, REFRESH_TOKEN_NAME } from "../cookie.config";
import { GetSessionId } from "../decorators/GetSessionId.decorator";
import { TwoFactorChallengeScopeGuard } from "../guards/two-factor-challenge-scope.guard";
import { GetSessionPayload } from "../decorators/GetSessionPayload.decorator";
import { TwofaDto } from "../../2fa/dto/2fa.dto";
import { VerifyBackupCodeLoginHttpDto } from "../dto/verify-backup-code-login.http-dto";
import type { SessionPayload } from "../types/auth.types";
import { PasswordRecoveryRequestDto } from "../dto/password-recovery-request.dto";
import { PasswordRecoveryChangeDto } from "../dto/password-recovery-change.dto";
import { PasswordRecoveryService } from "../services/password-recovery.service";
import { AppleAuthGuard } from "../guards/apple-auth.guard";
import { AppleMobileDto } from "../dto/apple-mobile.dto";
import { AppleTokenService } from "../services/apple-token.service";
import { RegisterService } from "../services/register.service";
import { RegisterDto } from "../dto/register.dto";
import { buildOAuthFrontendRedirect } from "../utils/validate-redirect-url";
import { consumeOAuthPopupCookie } from "../utils/oauth-popup.guard-helper";

type RequestWithOAuthUser = Request & { user: OAuthProfile };

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleTokenService: GoogleTokenService,
    private readonly adminLoginService: AdminLoginService,
    private readonly two_factor_login_service: TwoFactorLoginService,
    private readonly password_recovery_service: PasswordRecoveryService,
    private readonly appleTokenService: AppleTokenService,
    private readonly registerService: RegisterService,
  ) { }

  @Post("register")
  register(@Body() registerDto: RegisterDto) {
    return this.registerService.register(registerDto);
  }

  @Post("login")
  login(@Body() loginDto: LoginDto, @Req() req: Request) {
    return this.authService.signIn({ loginDto, request: req });
  }

  @Post("admin/login")
  async adminLogin(
    @Body() adminLoginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.adminLoginService.signIn({
      adminLoginDto,
      request: req,
    });

    res.cookie(REFRESH_TOKEN_NAME, result.refresh_token, authCookieConfig.refresh_token);
    res.cookie(ACCESS_TOKEN_NAME, result.token, authCookieConfig.access_token);

    return {
      message: "Login successful",
      data: {
        type: result.type === "2fa_challenge" ? "2fa_required" : "session",
        email: adminLoginDto.email,
      },
    };
  }

  @Get("admin/two-factor/challenge")
  @UseGuards(JwtGuard, TwoFactorChallengeScopeGuard)
  getAdminTwoFactorChallenge(@GetSessionPayload() session_payload: SessionPayload) {
    return this.two_factor_login_service.getChallengeStatus(
      session_payload.email,
    );
  }

  @Post("admin/verify-2fa")
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

    res.cookie(ACCESS_TOKEN_NAME, result.token, authCookieConfig.access_token);

    return {
      message: "Verificación completada correctamente",
      data: { type: result.type, token: result.token },
    };
  }

  @Post("admin/verify-backup-code")
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

    res.cookie(ACCESS_TOKEN_NAME, result.token, authCookieConfig.access_token);

    return {
      message: "Código de respaldo validado correctamente",
      data: { type: result.type, token: result.token },
    };
  }

  @Get("two-factor/challenge")
  @UseGuards(JwtGuard, TwoFactorChallengeScopeGuard)
  getTwoFactorChallenge(@GetSessionPayload() session_payload: SessionPayload) {
    return this.two_factor_login_service.getChallengeStatus(
      session_payload.email,
    );
  }

  @Post("verify-2fa")
  @UseGuards(JwtGuard, TwoFactorChallengeScopeGuard)
  async verifyTwoFactorLogin(
    @GetSessionPayload() session_payload: SessionPayload,
    @Body() twofa_dto: TwofaDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.two_factor_login_service.verifyTotpChallenge(
      session_payload.id,
      twofa_dto,
      session_payload,
    );

    res.cookie(ACCESS_TOKEN_NAME, result.token, authCookieConfig.access_token);

    return {
      message: "Verificación completada correctamente",
      data: { type: result.type, token: result.token },
    };
  }

  @Post("verify-backup-code")
  @UseGuards(JwtGuard, TwoFactorChallengeScopeGuard)
  async verifyBackupCodeLogin(
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

    res.cookie(ACCESS_TOKEN_NAME, result.token, authCookieConfig.access_token);

    return {
      message: "Código de respaldo validado correctamente",
      data: { type: result.type, token: result.token },
    };
  }

  @Post("admin/logout")
  @UseGuards(JwtGuard)
  async adminLogout(
    @Res({ passthrough: true }) res: Response,
    @GetSessionId() session_id: string,
  ) {
    await this.adminLoginService.logout(session_id);
    res.clearCookie(REFRESH_TOKEN_NAME);
    res.clearCookie(ACCESS_TOKEN_NAME);
    return {
      message: "Logout successful",
    };
  }

  @Get("google")
  @UseGuards(GoogleAuthGuard)
  googleAuth(): void {
    // passport redirige automáticamente a Google
  }

  @Get("google/callback")
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: RequestWithOAuthUser, @Res() res: Response) {
    const isPopup = consumeOAuthPopupCookie(req, res);
    const { token, refresh_token, type } = await this.authService.signInWithOAuthProfile(req.user, req);
    const url = buildOAuthFrontendRedirect(
      { token, refresh_token, type },
      { popup: isPopup, provider: "google" },
    );
    res.redirect(url);
  }

  @Post("google/mobile")
  async googleMobile(@Body() dto: GoogleMobileDto, @Req() req: Request) {
    const profile = await this.googleTokenService.verifyIdToken(dto.id_token);
    const token = await this.authService.signInWithOAuthProfile(profile, req);
    return { token };
  }

  // ---- Apple (deshabilitado hasta tener credenciales) ----
  @Get("apple")
  @UseGuards(AppleAuthGuard)
  appleAuth(): void {
    // passport redirige automáticamente a Apple
  }
  
  @Post("apple/callback")
  @UseGuards(AppleAuthGuard)
  async appleCallback(@Req() req: RequestWithOAuthUser, @Res() res: Response) {
    const isPopup = consumeOAuthPopupCookie(req, res);
    const { token, refresh_token, type } = await this.authService.signInWithOAuthProfile(req.user, req);
    const url = buildOAuthFrontendRedirect(
      { token, refresh_token, type },
      { popup: isPopup, provider: "apple" },
    );
    res.redirect(url);
  }
  
  @Post("apple/mobile")
  async appleMobile(@Body() dto: AppleMobileDto, @Req() req: Request) {
    const profile = await this.appleTokenService.verifyIdentityToken(dto.identity_token);
    const token = await this.authService.signInWithOAuthProfile(profile, req);
    return { token };
  }

  @Post("refresh")
  @UseGuards(RefreshTokenGuard)
  refreshToken(@GetRefreshToken() refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }


  @Post("admin/refresh")
  @UseGuards(RefreshTokenGuard)
  async adminRefreshToken(@GetRefreshToken() refreshToken: string, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.refreshToken(refreshToken);
    res.cookie(REFRESH_TOKEN_NAME, result.refresh_token, authCookieConfig.refresh_token);
    res.cookie(ACCESS_TOKEN_NAME, result.token, authCookieConfig.access_token);
    return result;
  }

  @Post("admin/password-recovery/request")
  async adminPasswordRecoveryRequest(@Body() dto: PasswordRecoveryRequestDto) {
    await this.password_recovery_service.requestAdminRecovery(dto.email, dto.redirect_url);
    return {
      message: "Si el email está registrado, vas a recibir un correo con instrucciones.",
    };
  }

  @Post("admin/password-recovery/change")
  async adminPasswordRecoveryChange(@Body() dto: PasswordRecoveryChangeDto) {
    await this.password_recovery_service.changeAdminPassword(dto.token, dto.password);
    return {
      message: "Contraseña actualizada correctamente.",
    };
  }

  @Get("logout")
  @UseGuards(JwtGuard)
  logout(@GetSessionId() session_id: string) {
    return this.authService.logout(session_id);
  }
}
