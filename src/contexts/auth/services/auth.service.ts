import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
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
import { envs, MONTH } from "@/src/common/envs";
import { authResponseConfig } from "../response.config";
import { RolesService } from "../../roles/services/roles.service";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly userService: UserService,
    private readonly suspensionService: SuspensionService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly roleService: RolesService,
  ) { }

  async signIn({
    loginDto, request, ignorePassword = false
  }: {
    loginDto: LoginDto, request: Request
    ignorePassword?: boolean
  }): Promise<SignInResult> {
    const user = await this.userService.findOneByEmailWithPassword(loginDto.email);
    if (user.provider !== "local" || !user.password) {
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
    const { session_id, refreshToken_hash } = await this.createSession(user, request);
    await this.suspensionService.assert_session_allowed_by_id(user.id);

    await this.userService.update(user.id, {
      last_sign_in: new Date(),
    });

    const type = user.two_factor_enabled ? "2fa_challenge" : "session";
    const token = this.createToken({ user, session_id, refreshToken_hash, expiresIn: "30d" });

    return { type, token, refreshToken_hash }

  }

  async createSession(user: User, request: Request): Promise<{ session_id: string, refreshToken_hash: string }> {
    const currentSession = await this.sessionService.findOneByIpAddress(request.ip);
    if (currentSession) {
      await this.sessionService.delete(currentSession.id);
    }
    const session = await this.sessionService.create(user, request);
    const refreshToken = await this.refreshTokenService.createForSession(user, session);

    return {
      session_id: session.id,
      refreshToken_hash: refreshToken.token_hash,
    };
  }

  async signInWithOAuthProfile(profile: OAuthProfile, request: Request): Promise<SignInResult> {
    if (!profile.email) {
      this.logger.error("El proveedor no devolvió un email");
      throw new UnauthorizedException(authResponseConfig.messages.AUTHENTICATION_ERROR);
    }
    const role = await this.roleService.findDefault();
    if (!role) {
      throw new UnauthorizedException(authResponseConfig.messages.ROLE_NOT_FOUND);
    }
    const user = await this.userService.findOrCreateOAuthUser({
      ...profile,
      role_id: role.id,
    });
    await this.suspensionService.assert_session_allowed_by_id(user.id);
    await this.userService.update(user.id, {
      last_sign_in: new Date(),
    });

    const { session_id, refreshToken_hash } = await this.createSession(user, request);
    return { type: "session", token: this.createToken({ user, session_id, refreshToken_hash, expiresIn: "30d" }), refreshToken_hash: refreshToken_hash };
  }

  createToken({
    user,
    session_id,
    refreshToken_hash,
  }: { user: User, session_id: string, refreshToken_hash: string, expiresIn?: string }) {
    const payload: SessionPayload = {
      id: user.id,
      email: user.email,
      session_id: session_id,
      refreshToken_hash: refreshToken_hash,
      scope: user.two_factor_enabled ? "2fa_challenge" : "session"
    };
    return this.jwtService.sign(payload,
      { expiresIn: envs.ACCESS_TOKEN_EXPIRES_IN as any },
    );
  }

  async logout(request: Request) {
    const session = await this.sessionService.findOneByIpAddress(request.ip);
    if (!session) {
      return;
    }
    await this.sessionService.delete(session.id);
  }

  async refreshToken(refreshToken: string): Promise<SignInResult> {
    const refresh_token = await this.refreshTokenService.findByTokenHash(refreshToken);
    const user = await this.userService.findOne(refresh_token.session.user_id);
    await this.refreshTokenService.revokeBySessionId(refresh_token.session.id);
    const newRefreshToken = await this.refreshTokenService.createForSession(user, refresh_token.session, refresh_token.id);
    const session = await this.sessionService.update(refresh_token.session.id, {
      refreshed_at: new Date(),
      expires_at: new Date(Date.now() + MONTH),
    });
    const token = this.createToken({ user, session_id: session.id, refreshToken_hash: newRefreshToken.token_hash, expiresIn: envs.ACCESS_TOKEN_EXPIRES_IN as any });
    return { type: "session", token, refreshToken_hash: newRefreshToken.token_hash };
  }
}
