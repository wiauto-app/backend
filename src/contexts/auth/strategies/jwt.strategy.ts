import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";

import { envs } from "@/src/common/envs";
import { SessionPayload } from "../types/auth.types";
import { UserService } from "../../users/services/user.service";
import { SuspensionService } from "../../users/services/suspension.service";
import { User } from "../../users/entities/user.entity";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ProfileService } from "../../profiles/services/profile.service";
import { SessionService } from "../services/session.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    private readonly userService: UserService,
    private readonly profileService: ProfileService,
    private readonly suspensionService: SuspensionService,
    private readonly sessionService: SessionService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const authorization = req.headers.authorization;
          const cookie_access_token = req.cookies.access_token as string;
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
    });
  }

  async validate(payload: SessionPayload): Promise<User> {
    await this.suspensionService.assert_session_allowed_by_id(payload.id);
    const session = await this.sessionService.findOne(payload.session_id);
    if (session.expires_at < new Date()) {
      throw new UnauthorizedException("Session expired");
    }
    const [user, profile] = await Promise.all([
      this.userService.findOne(payload.id),
      this.profileService.findOne(payload.id),
    ]);
    return {
      ...user,
      profile,
    };
  }
}
