import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import * as jwt from "jsonwebtoken";
import { Request } from "express";
import { Strategy } from "passport-apple";

import { envs } from "@/src/common/envs";
import { OAuthProfile } from "./google.strategy";

interface AppleIdTokenPayload {
  sub: string;
  email?: string;
}

interface AppleUserProfile {
  name?: {
    firstName?: string;
    lastName?: string;
  };
}

type RequestWithAppleProfile = Request & {
  appleProfile?: AppleUserProfile;
};

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, "apple", true) {
  constructor() {
    super({
      clientID: envs.APPLE_CLIENT_ID,
      teamID: envs.APPLE_TEAM_ID,
      keyID: envs.APPLE_KEY_ID,
      privateKeyString: envs.APPLE_PRIVATE_KEY.replaceAll(
        String.raw`\n`,
        "\n",
      ),
      callbackURL: envs.APPLE_CALLBACK_URL,
      passReqToCallback: true,
    });
  }

  validate(
    req: RequestWithAppleProfile,
    _accessToken: string,
    _refreshToken: string,
    idToken: string,
    // Requerido por passport-oauth2 (arity 6); el nombre real viene en req.appleProfile
    profile: AppleUserProfile,
  ): OAuthProfile {
    void profile;
    const payload = jwt.decode(idToken) as AppleIdTokenPayload | null;

    if (!payload?.sub) {
      throw new Error("Apple idToken inválido");
    }

    const appleProfile = req.appleProfile;

    return {
      provider: "apple",
      provider_id: payload.sub,
      email: payload.email ?? "",
      first_name: appleProfile?.name?.firstName ?? "",
      last_name: appleProfile?.name?.lastName ?? undefined,
    };
  }
}
