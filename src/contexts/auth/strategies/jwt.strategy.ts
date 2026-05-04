import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";

import { envs } from "@/src/common/envs";
import { SessionPayload } from "../types/auth.types";
import { UserService } from "../../users/services/user.service";
import { SuspensionService } from "../../users/services/suspension.service";
import { User } from "../../users/entities/user.entity";
import { Injectable } from "@nestjs/common";
import { ProfileService } from "../../profiles/services/profile.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    private readonly userService: UserService,
    private readonly profileService: ProfileService,
    private readonly suspensionService: SuspensionService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const authorization = req.headers.authorization;

          if (!authorization) return null;

          if (authorization.startsWith("Bearer")) {
            return authorization.slice(7);
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
