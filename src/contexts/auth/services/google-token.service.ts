import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { OAuth2Client } from "google-auth-library";

import { envs } from "@/src/common/envs";
import { OAuthProfile } from "../strategies/google.strategy";
import { authResponseConfig } from "../response.config";

@Injectable()
export class GoogleTokenService {
  private readonly client = new OAuth2Client(envs.GOOGLE_CLIENT_ID);
  private readonly logger = new Logger(GoogleTokenService.name);
  async verifyIdToken(idToken: string): Promise<OAuthProfile> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: envs.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();

      if (!payload?.sub || !payload.email) {
        this.logger.error("Google token inválido");
        throw new UnauthorizedException(authResponseConfig.messages.INVALID_TOKEN);
      }

      return {
        provider: "google",
        provider_id: payload.sub,
        email: payload.email,
        first_name: payload.given_name ?? "",
        last_name: payload.family_name ?? undefined,
      };
    } catch {
      this.logger.error("Google token inválido");
      throw new UnauthorizedException(authResponseConfig.messages.INVALID_TOKEN);
    }
  }
}
