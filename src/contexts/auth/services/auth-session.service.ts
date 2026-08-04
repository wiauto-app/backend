import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Request } from "express";
import { Repository } from "typeorm";

import { envs } from "@/src/common/envs";
import { User } from "../../users/entities/user.entity";
import { SuspensionService } from "../../users/services/suspension.service";
import { SessionPayload, SignInResult } from "../types/auth.types";
import { normalizeUserAgent } from "../utils/normalize-user-agent";
import { AuthSecurityMailService } from "./auth-security-mail.service";
import { RefreshTokenService } from "./refresh-token.service";
import { SessionService } from "./session.service";

export interface CreateSessionResult {
  session_id: string;
  refresh_token: string;
  refresh_token_hash: string;
}

@Injectable()
export class AuthSessionService {
  constructor(
    private readonly suspensionService: SuspensionService,
    private readonly sessionService: SessionService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly jwtService: JwtService,
    private readonly authSecurityMailService: AuthSecurityMailService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async establishSessionForUser(user: User, request: Request): Promise<SignInResult> {
    await this.suspensionService.assert_session_allowed_by_id(user.id);

    const previous_last_sign_in = user.last_sign_in;
    const notify_new_login = previous_last_sign_in != null;

    const { session_id, refresh_token, refresh_token_hash } = await this.createSession(
      user,
      request,
    );

    await this.userRepository.update(user.id, {
      last_sign_in: new Date(),
    });

    const type = user.two_factor_enabled ? "2fa_challenge" : "session";
    const token = this.signSessionToken({
      user,
      session_id,
      refresh_token_hash,
      notify_new_login: type === "2fa_challenge" ? notify_new_login : undefined,
    });

    if (type === "session" && notify_new_login) {
      this.authSecurityMailService.enqueueNewLogin({
        to: user.email,
        ip_address: request.ip ?? null,
        user_agent: normalizeUserAgent(
          request.headers["user-agent"] as string | undefined,
        ),
        audience: "platform",
      });
    }

    return { type, token, refresh_token };
  }

  async createSession(user: User, request: Request): Promise<CreateSessionResult> {
    const session = await this.sessionService.create(user, request);
    const { entity, raw_token } = await this.refreshTokenService.createForSession(
      user,
      session,
    );

    return {
      session_id: session.id,
      refresh_token: raw_token,
      refresh_token_hash: entity.token_hash,
    };
  }

  signSessionToken({
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
  }): string {
    const payload: SessionPayload = {
      id: user.id,
      email: user.email,
      session_id,
      refreshToken_hash: refresh_token_hash,
      scope: scope ?? (user.two_factor_enabled ? "2fa_challenge" : "session"),
      ...(notify_new_login !== undefined ? { notify_new_login } : {}),
    };
    return this.jwtService.sign(payload, {
      expiresIn: envs.ACCESS_TOKEN_EXPIRES_IN as `${number}ms` | number,
    });
  }
}
