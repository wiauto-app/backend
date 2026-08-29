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
import { TwoFactorLoginService } from "../services/two-factor-login.service";
import {
  ACCESS_TOKEN_NAME,
  REFRESH_TOKEN_NAME,
  authCookieConfig,
} from "../cookie.config";
import { GetSessionId } from "../decorators/GetSessionId.decorator";
import { TwoFactorChallengeScopeGuard } from "../guards/two-factor-challenge-scope.guard";
import { GetSessionPayload } from "../decorators/GetSessionPayload.decorator";
import { TwofaDto } from "../../2fa/dto/2fa.dto";
import { VerifyBackupCodeLoginHttpDto } from "../dto/verify-backup-code-login.http-dto";
import type { SessionPayload } from "../types/auth.types";
import { AppleAuthGuard } from "../guards/apple-auth.guard";
import { AppleMobileDto } from "../dto/apple-mobile.dto";
import { RefreshTokenMobileDto } from "../dto/refresh-token-mobile.dto";
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
    private readonly two_factor_login_service: TwoFactorLoginService,
    private readonly appleTokenService: AppleTokenService,
    private readonly registerService: RegisterService,
  ) {}

  @Post("register")
  register(@Body() registerDto: RegisterDto) {
    return this.registerService.register(registerDto);
  }

  private setPlatformSessionCookies(
    res: Response,
    tokens: { token: string; refresh_token: string },
  ): void {
    res.cookie(
      REFRESH_TOKEN_NAME,
      tokens.refresh_token,
      authCookieConfig.refresh_token,
    );
    res.cookie(
      ACCESS_TOKEN_NAME,
      tokens.token,
      authCookieConfig.access_token,
    );
  }

  @Post("login")
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.signIn({ loginDto, request: req });

    this.setPlatformSessionCookies(res, {
      token: result.token,
      refresh_token: result.refresh_token,
    });

    return result;
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

  /**
   * Refresh para clientes sin cookies (app móvil): el token viaja en el body
   * y la respuesta devuelve el par completo, sin `Set-Cookie`.
   */
  @Post("refresh/mobile")
  async refreshTokenMobile(@Body() dto: RefreshTokenMobileDto) {
    return this.authService.refreshToken(dto.refresh_token);
  }

  @Post("refresh")
  @UseGuards(RefreshTokenGuard)
  async refreshToken(@GetRefreshToken() refreshToken: string,@Res({ passthrough: true }) res: Response) {
    const result = await this.authService.refreshToken(refreshToken);
    res.cookie(ACCESS_TOKEN_NAME, result.token, authCookieConfig.access_token);
    return result;
  }

  private clearPlatformCookies(res: Response): void {
    res.cookie(REFRESH_TOKEN_NAME, "", {
      ...authCookieConfig.refresh_token,
      maxAge: 0,
    });
    res.cookie(ACCESS_TOKEN_NAME, "", {
      ...authCookieConfig.access_token,
      maxAge: 0,
    });
  }

  @Get("logout")
  @UseGuards(JwtGuard)
  async logout(
    @GetSessionId() session_id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(session_id);
    this.clearPlatformCookies(res);
    return {
      message: "Logout successful",
    };
  }
}
