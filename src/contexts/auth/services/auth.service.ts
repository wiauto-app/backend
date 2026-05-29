import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectDataSource } from "@nestjs/typeorm";
import { Request } from "express";
import { DataSource } from "typeorm";

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
import { RefreshTokenEntity } from "../entities/refresh-token.entity";
import { SessionEntity } from "../entities/session.entity";
import { generateToken } from "../../shared/token_management/generate_token";
import { hashToken } from "../../shared/token_management/hash_token";

export interface CreateSessionResult {
  session_id: string;
  refresh_token: string;
  refresh_token_hash: string;
};

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
    @InjectDataSource()
    private readonly data_source: DataSource,
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

    await this.suspensionService.assert_session_allowed_by_id(user.id);

    const { session_id, refresh_token, refresh_token_hash } = await this.createSession(user, request);

    await this.userService.update(user.id, {
      last_sign_in: new Date(),
    });

    const type = user.two_factor_enabled ? "2fa_challenge" : "session";
    const token = this.createToken({ user, session_id, refresh_token_hash });

    return { type, token, refresh_token };
  }

  async createSession(user: User, request: Request): Promise<CreateSessionResult> {
    const session = await this.sessionService.create(user, request);
    const { entity, raw_token } = await this.refreshTokenService.createForSession(user, session);

    return {
      session_id: session.id,
      refresh_token: raw_token,
      refresh_token_hash: entity.token_hash,
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

    const { session_id, refresh_token, refresh_token_hash } = await this.createSession(user, request);
    return {
      type: "session",
      token: this.createToken({ user, session_id, refresh_token_hash }),
      refresh_token,
    };
  }

  createToken({
    user,
    session_id,
    refresh_token_hash,
    scope,
  }: {
    user: User;
    session_id: string;
    refresh_token_hash: string;
    scope?: SessionPayload["scope"];
  }) {
    const payload: SessionPayload = {
      id: user.id,
      email: user.email,
      session_id: session_id,
      refreshToken_hash: refresh_token_hash,
      scope:
        scope ?? (user.two_factor_enabled ? "2fa_challenge" : "session"),
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

  async refreshToken(raw_token: string): Promise<SignInResult> {
    const token_hash = hashToken(raw_token);
    const revoked = await this.refreshTokenService.findRevokedByTokenHash(token_hash);
    if (revoked) {
      await this.sessionService.delete(revoked.session_id);
      throw new UnauthorizedException(authResponseConfig.messages.INVALID_TOKEN);
    }

    const refresh_token = await this.refreshTokenService.findByRawToken(raw_token);
    const user = await this.userService.findOne(refresh_token.session.user_id);

    const { raw_token: new_raw_token, refresh_token_hash } = await this.data_source.transaction(
      async (manager) => {
        await manager.update(RefreshTokenEntity, { session_id: refresh_token.session_id }, { revoked: true });

        const raw_new_token = generateToken();
        const new_refresh_token = manager.create(RefreshTokenEntity, {
          user_id: user.id,
          token_hash: hashToken(raw_new_token),
          session_id: refresh_token.session_id,
          revoked: false,
          expires_at: new Date(Date.now() + MONTH),
          parent_id: refresh_token.id,
        });
        const saved_refresh_token = await manager.save(new_refresh_token);

        const session_updated = await manager.preload(SessionEntity, {
          id: refresh_token.session_id,
          refreshed_at: new Date(),
          expires_at: new Date(Date.now() + MONTH),
        });
        if (!session_updated) {
          throw new UnauthorizedException(authResponseConfig.messages.SESSION_NOT_FOUND);
        }
        await manager.save(session_updated);

        return {
          raw_token: raw_new_token,
          refresh_token_hash: saved_refresh_token.token_hash,
        };
      },
    );

    const scope = user.two_factor_enabled ? "2fa_challenge" : "session";
    const token = this.createToken({
      user,
      session_id: refresh_token.session_id,
      refresh_token_hash,
      scope,
    });
    return {
      type: scope,
      token,
      refresh_token: new_raw_token,
    };
  }
}
