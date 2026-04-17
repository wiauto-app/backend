import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-apple";

import { envs } from "@/src/common/envs";
import { OAuthProfile } from "./google.strategy";

interface AppleIdTokenPayload {
  sub: string;
  email?: string;
}

interface AppleRawProfile {
  name?: {
    firstName?: string;
    lastName?: string;
  };
}

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, "apple") {
  constructor() {
    super({
      clientID: envs.APPLE_CLIENT_ID,
      teamID: envs.APPLE_TEAM_ID,
      keyID: envs.APPLE_KEY_ID,
      privateKeyString: envs.APPLE_PRIVATE_KEY,
      callbackURL: envs.APPLE_CALLBACK_URL,
      scope: ["email", "name"],
      passReqToCallback: false,
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    idToken: AppleIdTokenPayload,
    profile: AppleRawProfile,
    done: (err: unknown, user?: OAuthProfile) => void,
  ): void {
    if (!idToken.sub) {
      done(new Error("Apple idToken inválido"));
      return;
    }

    const oauthProfile: OAuthProfile = {
      provider: "apple",
      provider_id: idToken.sub,
      email: idToken.email ?? "",
      first_name: profile.name?.firstName ?? null,
      last_name: profile.name?.lastName ?? null,
    };
    done(null, oauthProfile);
  }
}
