import { createHash } from "node:crypto";

import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { OAuth2Client, type TokenPayload } from "google-auth-library";

import { envs } from "@/src/common/envs";
import { OAuthProfile } from "../strategies/google.strategy";
import { authResponseConfig } from "../response.config";
import { AVAILABLE_PLATFORMS, GoogleMobileDto } from "../dto/google-mobile.dto";
import { GoogleOneTapHttpDto } from "../dto/google-one-tap.http-dto";

@Injectable()
export class GoogleTokenService {
  private readonly client = new OAuth2Client(envs.GOOGLE_CLIENT_ID);
  private readonly logger = new Logger(GoogleTokenService.name);

  async verifyIdToken(dto: GoogleMobileDto): Promise<OAuthProfile> {
    const audiences = this.allowedAudiences(dto.platform);
    return this.verify(dto.id_token, audiences, `plataforma ${dto.platform}`);
  }

  async verifyWebIdToken(dto: GoogleOneTapHttpDto): Promise<OAuthProfile> {
    if (!envs.GOOGLE_CLIENT_ID) {
      this.logger.error("GOOGLE_CLIENT_ID no configurado para One Tap web");
      throw new UnauthorizedException(authResponseConfig.messages.INVALID_TOKEN);
    }

    const { profile, payload } = await this.verifyWithPayload(
      dto.id_token,
      [envs.GOOGLE_CLIENT_ID],
      "One Tap web",
    );

    const expectedNonce = createHash("sha256")
      .update(dto.nonce)
      .digest("hex");

    if (!payload.nonce || payload.nonce !== expectedNonce) {
      this.logger.error("Nonce de Google One Tap inválido");
      throw new UnauthorizedException(authResponseConfig.messages.INVALID_TOKEN);
    }

    return profile;
  }

  private async verify(
    idToken: string,
    audiences: [string, ...string[]],
    contextLabel: string,
  ): Promise<OAuthProfile> {
    const { profile } = await this.verifyWithPayload(idToken, audiences, contextLabel);
    return profile;
  }

  private async verifyWithPayload(
    idToken: string,
    audiences: [string, ...string[]],
    contextLabel: string,
  ): Promise<{ profile: OAuthProfile; payload: TokenPayload }> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: audiences,
      });
      const payload = ticket.getPayload();

      if (!payload?.sub || !payload.email) {
        this.logger.error("Google token sin sub o email");
        throw new UnauthorizedException(authResponseConfig.messages.INVALID_TOKEN);
      }

      return {
        profile: {
          provider: "google",
          provider_id: payload.sub,
          email: payload.email,
          first_name: payload.given_name ?? "",
          last_name: payload.family_name ?? undefined,
        },
        payload,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error(
        `Google token inválido (${contextLabel}). Audiencias aceptadas: ${audiences.join(", ")}`,
        error instanceof Error ? error.message : error,
      );
      throw new UnauthorizedException(authResponseConfig.messages.INVALID_TOKEN);
    }
  }

  /**
   * The `aud` claim holds the client ID that requested the token, which varies
   * per platform. The web client ID is accepted as a fallback because
   * `expo-auth-session` uses it outside native builds.
   */
  private allowedAudiences(platform: AVAILABLE_PLATFORMS): [string, ...string[]] {
    const platformClientId =
      platform === AVAILABLE_PLATFORMS.ANDROID ? envs.GOOGLE_CLIENT_ID : envs.GOOGLE_IOS_CLIENT_ID;

    const audiences = [...new Set([platformClientId, envs.GOOGLE_CLIENT_ID])].filter(Boolean);

    if (audiences.length === 0) {
      this.logger.error(
        `Sin client IDs de Google para ${platform}: define GOOGLE_CLIENT_ID y GOOGLE_IOS_CLIENT_ID.`,
      );
      throw new UnauthorizedException(authResponseConfig.messages.INVALID_TOKEN);
    }

    return audiences as [string, ...string[]];
  }
}
