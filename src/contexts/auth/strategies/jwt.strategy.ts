import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Injectable, UnauthorizedException } from "@nestjs/common";

import { envs } from "@/src/common/envs";
import { SessionPayload } from "../types/auth.types";
import { UserService } from "../../users/services/user.service";
import { SuspensionService } from "../../users/services/suspension.service";
import { User } from "../../users/entities/user.entity";
import { RefreshTokenService } from "../services/refresh-token.service";
import { SessionService } from "../services/session.service";
import { authResponseConfig } from "../response.config";
import { isTwoFactorChallengeAllowedPath } from "../constants/two-factor-challenge.constants";
import { ACCESS_TOKEN_NAME } from "../cookie.config";
import { ADMIN_ACCESS_TOKEN_NAME } from "../admin-cookie.config";
import { isAdminAuthRequest } from "../utils/is-admin-auth-request";

const extractAccessTokenFromRequest = (req: Request): string | null => {
  const authorization = req.headers.authorization;
  if (authorization?.startsWith("Bearer ")) {
    const bearer = authorization.slice(7).trim();
    if (bearer) {
      return bearer;
    }
  }

  const cookies = req.cookies as Record<string, string | undefined> | undefined;
  if (!cookies) {
    return null;
  }

  if (isAdminAuthRequest(req)) {
    const admin_token = cookies[ADMIN_ACCESS_TOKEN_NAME]?.trim();
    return admin_token ?? null;
  }

  const platform_token = cookies[ACCESS_TOKEN_NAME]?.trim();
  return platform_token ?? null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    private readonly userService: UserService,
    private readonly suspensionService: SuspensionService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly sessionService: SessionService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        extractAccessTokenFromRequest,
      ]),
      ignoreExpiration: false,
      secretOrKey: envs.JWT_SECRET,
      passReqToCallback: true,

    });
  }

  async validate(req: Request, payload: SessionPayload): Promise<User> {
    await this.suspensionService.assert_session_allowed_by_id(payload.id);
    const session = await this.sessionService.findActiveById(payload.session_id);
    const refresh_token = await this.refreshTokenService.findByTokenHash(payload.refreshToken_hash);
    if (refresh_token.session_id !== session.id) {
      throw new UnauthorizedException(authResponseConfig.messages.INVALID_TOKEN);
    }

    const scope = payload.scope;

    req.auth_session_id = payload.session_id;
    req.auth_scope = scope;
    req.auth_session_payload = { ...payload, scope };

    if (
      scope === "2fa_challenge" &&
      !isTwoFactorChallengeAllowedPath(req.path)
    ) {
      throw new UnauthorizedException(
        authResponseConfig.messages.TWO_FA_REQUIRED,
      );
    }

    const user = await this.userService.findOne(payload.id);
    return user;
  }
}
