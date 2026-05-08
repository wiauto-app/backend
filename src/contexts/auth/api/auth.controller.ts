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
import { RefreshTokenDto } from "../../2fa/dto/refresh-token.dto";

type RequestWithOAuthUser = Request & { user: OAuthProfile };

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleTokenService: GoogleTokenService,
    // private readonly appleTokenService: AppleTokenService,
  ) {}

  

  @Post("login")
  login(@Body() loginDto: LoginDto, @Req() req: Request) {
    return this.authService.signIn({ loginDto, request: req });
  }

  @Get("google")
  @UseGuards(GoogleAuthGuard)
  googleAuth(): void {
    // passport redirige automáticamente a Google
  }

  @Get("google/callback")
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: RequestWithOAuthUser, @Res() res: Response) {
    const token = await this.authService.signInWithOAuthProfile(req.user, req);
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

  @Post("refresh-token")
  @UseGuards(JwtGuard)
  refreshToken(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    return this.authService.refreshToken(dto, req);
  }

  @Get("logout")
  @UseGuards(JwtGuard)
  logout(@Req() req: Request) {
    return this.authService.logout(req);
  }
}
