import { Injectable, UnauthorizedException } from "@nestjs/common";
import { OAuth2Client } from "google-auth-library";

import { envs } from "@/src/common/envs";
import { OAuthProfile } from "../strategies/google.strategy";

@Injectable()
export class GoogleTokenService {
  private readonly client = new OAuth2Client(envs.GOOGLE_CLIENT_ID);

  async verifyIdToken(idToken: string): Promise<OAuthProfile> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: envs.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();

      if (!payload || !payload.sub || !payload.email) {
        throw new UnauthorizedException("Google token inválido");
      }

      return {
        provider: "google",
        provider_id: payload.sub,
        email: payload.email,
        first_name: payload.given_name ?? null,
        last_name: payload.family_name ?? null,
      };
    } catch {
      throw new UnauthorizedException("Google token inválido");
    }
  }
}
