import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";

import { SuspensionService } from "../../users/services/suspension.service";
import { UserService } from "../../users/services/user.service";
import { LoginDto } from "../dto/login.dto";
import { User } from "../../users/entities/user.entity";
import { OAuthProfile } from "../strategies/google.strategy";
import { SessionPayload, SignInResult } from "../types/auth.types";
import { PasswordService } from "./password.service";
import { RefreshTokenService } from "./refresh-token.service";
import { SessionService } from "./session.service";
import { AuthSessionService } from "./auth-session.service";
import { envs } from "@/src/common/envs";
import { authResponseConfig } from "../response.config";

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly suspensionService: SuspensionService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly authSessionService: AuthSessionService,
  ) { }

  async signIn({
    loginDto, request, ignorePassword = false
  }: {
    loginDto: LoginDto, request: Request
    ignorePassword?: boolean
  }): Promise<SignInResult> {
    const user = await this.userService.findOneByEmailWithPassword(loginDto.email);
    if (!user.password) {
      throw new UnauthorizedException(
        authResponseConfig.messages.DIFFERENT_PROVIDER,
      );
    }

    const isValidPassword = ignorePassword ? true : await this.passwordService.comparePassword(loginDto.password, user.password);

    if (!isValidPassword) {
      throw new UnauthorizedException(authResponseConfig.messages.INVALID_CREDENTIALS);
    }

    if (!user.is_email_verified) {
      throw new UnauthorizedException(
        authResponseConfig.messages.EMAIL_NOT_VERIFIED,
      );
    }

    return this.authSessionService.establishSessionForUser(user, request);
  }



  async createSession(user: User, request: Request) {
    return this.authSessionService.createSession(user, request);
  }

  async signInWithOAuthProfile(profile: OAuthProfile, request: Request): Promise<SignInResult> {
    const user = await this.userService.findOrCreateOAuthUser({
      ...profile,
    });

    return this.authSessionService.establishSessionForUser(user, request);
  }

  createToken({
    user,
    session_id,
    refresh_token_hash,
    scope,
    notify_new_login,
  }: {
    user: User;
    session_id: string;
    refresh_token_hash: string;
    scope?: SessionPayload["scope"];
    notify_new_login?: boolean;
  }) {
    const payload: SessionPayload = {
      id: user.id,
      email: user.email,
      session_id: session_id,
      refreshToken_hash: refresh_token_hash,
      scope:
        scope ?? (user.two_factor_enabled ? "2fa_challenge" : "session"),
      ...(notify_new_login !== undefined && notify_new_login ? { notify_new_login } : {}),
    };
    return this.jwtService.sign(payload, {
      expiresIn: envs.ACCESS_TOKEN_EXPIRES_IN as any,
    });
  }

  createVerifiedSessionToken({
    user,
    session_id,
    refresh_token_hash,
  }: {
    user: User;
    session_id: string;
    refresh_token_hash: string;
  }) {
    return this.createToken({
      user,
      session_id,
      refresh_token_hash,
      scope: "session",
    });
  }

  async logout(session_id: string): Promise<void> {
    if (!session_id) {
      return;
    }
    await this.sessionService.delete(session_id);
  }

  async refreshToken(hashedToken: string): Promise<SignInResult> {
    const refreshToken = await this.refreshTokenService.findByTokenHash(hashedToken);
    const accessToken = this.createToken({
      refresh_token_hash: refreshToken.token_hash,
      session_id: refreshToken.session_id,
      user: refreshToken.user,
      notify_new_login: false,
      scope: "session",
    })
    
    return {
      type: "session",
      token: accessToken,
      refresh_token: refreshToken.token_hash,
    }
  }

}
