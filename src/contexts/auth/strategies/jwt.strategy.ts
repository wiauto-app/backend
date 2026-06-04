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
        (req: Request) => {
          const authorization = req.headers.authorization;
          const cookie_access_token = req.cookies.access_token as string;
          console.log("cookie_access_token", cookie_access_token);
          if (!authorization && !cookie_access_token) return null;

          if (authorization?.startsWith("Bearer")) {
            return authorization.slice(7);
          }
          if (cookie_access_token) {
            return cookie_access_token;
          }

          return null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: envs.JWT_SECRET,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: SessionPayload): Promise<User> {
    await this.suspensionService.assert_session_allowed_by_id(payload.id);
    await this.sessionService.findActiveById(payload.session_id);
    const refresh_token = await this.refreshTokenService.findByTokenHash(payload.refreshToken_hash);
    if (refresh_token.session_id !== payload.session_id) {
      throw new UnauthorizedException(authResponseConfig.messages.INVALID_TOKEN);
    }

    const scope = payload.scope

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
