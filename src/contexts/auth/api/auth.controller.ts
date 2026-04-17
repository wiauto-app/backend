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

type RequestWithOAuthUser = Request & { user: OAuthProfile };

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleTokenService: GoogleTokenService,
    // private readonly appleTokenService: AppleTokenService,
  ) {}

  

  @Post("login")
  login(@Body() loginDto: LoginDto) {
    return this.authService.signIn(loginDto);
  }

  @Get("google")
  @UseGuards(GoogleAuthGuard)
  googleAuth(): void {
    // passport redirige automáticamente a Google
  }

  @Get("google/callback")
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: RequestWithOAuthUser, @Res() res: Response) {
    const token = await this.authService.signInWithOAuthProfile(req.user);
    res.redirect(`${envs.FRONTEND_REDIRECT_URL}?token=${token}`);
    return
  }

  @Post("google/mobile")
  async googleMobile(@Body() dto: GoogleMobileDto) {
    const profile = await this.googleTokenService.verifyIdToken(dto.id_token);
    const token = await this.authService.signInWithOAuthProfile(profile);
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
}
