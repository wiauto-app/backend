import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy, VerifyCallback } from "passport-google-oauth20";

import { envs } from "@/src/common/envs";

export interface OAuthProfile {
  provider: "google" | "apple";
  provider_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor() {
    super({
      clientID: envs.GOOGLE_CLIENT_ID,
      clientSecret: envs.GOOGLE_CLIENT_SECRET,
      callbackURL: envs.GOOGLE_CALLBACK_URL,
      scope: ["email", "profile"],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback): void {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error("Google profile sin email"), false);
      return;
    }

    const oauthProfile: OAuthProfile = {
      provider: "google",
      provider_id: profile.id,
      email,
      first_name: profile.name?.givenName ?? null,
      last_name: profile.name?.familyName ?? null,
    };
    done(null, oauthProfile as unknown as Express.User);
  }
}
