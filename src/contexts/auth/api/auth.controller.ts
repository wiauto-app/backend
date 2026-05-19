import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { Request, Response } from "express";

import { AuthService } from "../services/auth.service";
import { LoginDto } from "../dto/login.dto";
import { GoogleMobileDto } from "../dto/google-mobile.dto";
// import { AppleMobileDto } from "../dto/apple-mobile.dto";
import { GoogleAuthGuard } from "../guards/google-auth.guard";
// import { AppleAuthGuard } from "../guards/apple-auth.guard";
import { GoogleTokenService } from "../services/google-token.service";
// import { AppleTokenService } from "../services/apple-token.service";
import { OAuthProfile } from "../strategies/google.strategy";
import { envs } from "@/src/common/envs";
import { JwtGuard } from "../guards/auth.guard";
import { RefreshTokenGuard } from "../guards/refresh-token.guard";
import { GetRefreshToken } from "../decorators/GetRefreshToken.decorator";
import { AdminLoginService } from "../services/admin-login.service";
import { ACCESS_TOKEN_NAME, authCookieConfig, REFRESH_TOKEN_NAME } from "../cookie.config";

type RequestWithOAuthUser = Request & { user: OAuthProfile };

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleTokenService: GoogleTokenService,
    private readonly adminLoginService: AdminLoginService,
    // private readonly appleTokenService: AppleTokenService,
  ) { }



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

    res.cookie(REFRESH_TOKEN_NAME, result.refreshToken_hash, authCookieConfig.refresh_token);
    res.cookie(ACCESS_TOKEN_NAME, result.token, authCookieConfig.access_token);

    return {
      message: "Login successful",
    };
  }

  @Post("admin/logout")
  async adminLogout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.adminLoginService.logout(req);
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
    const { token } = await this.authService.signInWithOAuthProfile(req.user, req);
    res.redirect(`${envs.FRONTEND_REDIRECT_URL}?token=${token}`);
    return
  }

  @Post("google/mobile")
  async googleMobile(@Body() dto: GoogleMobileDto, @Req() req: Request) {
    const profile = await this.googleTokenService.verifyIdToken(dto.id_token);
    const token = await this.authService.signInWithOAuthProfile(profile, req);
    return { token };
  }

  // ---- Apple (deshabilitado hasta tener credenciales) ----
  // @Get("apple")
  // @UseGuards(AppleAuthGuard)
  // appleAuth(): void {
  //   // passport redirige automáticamente a Apple
  // }
  //
  // @Post("apple/callback")
  // @UseGuards(AppleAuthGuard)
  // async appleCallback(@Req() req: RequestWithOAuthUser, @Res() res: Response) {
  //   const token = await this.authService.signInWithOAuthProfile(req.user);
  //   return res.redirect(`${envs.FRONTEND_REDIRECT_URL}?token=${token}`);
  // }
  //
  // @Post("apple/mobile")
  // async appleMobile(@Body() dto: AppleMobileDto) {
  //   const profile = await this.appleTokenService.verifyIdentityToken(dto.identity_token);
  //   const token = await this.authService.signInWithOAuthProfile(profile);
  //   return { token };
  // }

  @Post("refresh")
  @UseGuards(RefreshTokenGuard)
  refreshToken(@GetRefreshToken() refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }


  @Post("admin/refresh")
  @UseGuards(RefreshTokenGuard)
  async adminRefreshToken(@GetRefreshToken() refreshToken: string, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.refreshToken(refreshToken);
    res.cookie(REFRESH_TOKEN_NAME, result.refreshToken_hash, authCookieConfig.refresh_token);
    res.cookie(ACCESS_TOKEN_NAME, result.token, authCookieConfig.access_token);
    return result;
  }

  @Get("logout")
  @UseGuards(JwtGuard)
  logout(@Req() req: Request) {
    return this.authService.logout(req);
  }
}
