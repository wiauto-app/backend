import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import * as jwt from "jsonwebtoken";
import jwksClient, { JwksClient } from "jwks-rsa";

import { envs } from "@/src/common/envs";
import { OAuthProfile } from "../strategies/google.strategy";
import { authResponseConfig } from "../response.config";

interface AppleIdTokenPayload extends jwt.JwtPayload {
  sub: string;
  email?: string;
}

@Injectable()
export class AppleTokenService {
  private readonly logger = new Logger(AppleTokenService.name); 
  private readonly jwks: JwksClient = jwksClient({
    jwksUri: "https://appleid.apple.com/auth/keys",
    cache: true,
    rateLimit: true,
  });

  /**
   * Web sign-in tokens carry the Service ID as audience, while native iOS
   * tokens carry the app bundle identifier. Both are accepted.
   */
  private get allowedAudiences(): [string, ...string[]] | null {
    const audiences = [envs.APPLE_CLIENT_ID, envs.APPLE_APP_BUNDLE_ID]
      .map((audience) => audience.trim())
      .filter((audience) => audience.length > 0);

    const [first, ...rest] = audiences;
    return first ? [first, ...rest] : null;
  }

  async verifyIdentityToken(identityToken: string): Promise<OAuthProfile> {
    const audiences = this.allowedAudiences;

    if (!audiences) {
      this.logger.error("Apple sign-in sin audiencia configurada");
      throw new UnauthorizedException(authResponseConfig.messages.AUTHENTICATION_ERROR);
    }

    const decoded = jwt.decode(identityToken, { complete: true });
    if (!decoded || typeof decoded === "string" || !decoded.header.kid) {
      this.logger.error("Apple token inválido");
      throw new UnauthorizedException(authResponseConfig.messages.AUTHENTICATION_ERROR);
    }

    let publicKey: string;
    try {
      const signingKey = await this.jwks.getSigningKey(decoded.header.kid);
      publicKey = signingKey.getPublicKey();
    } catch {
      this.logger.error("No se pudo obtener la clave pública de Apple");
      throw new UnauthorizedException(authResponseConfig.messages.AUTHENTICATION_ERROR);
    }

    let payload: AppleIdTokenPayload;
    try {
      payload = jwt.verify(identityToken, publicKey, {
        audience: audiences,
        issuer: "https://appleid.apple.com",
      }) as AppleIdTokenPayload;
    } catch {
      this.logger.error("Apple token expirado o inválido");
      throw new UnauthorizedException(authResponseConfig.messages.AUTHENTICATION_ERROR);
    }

    if (!payload.sub) {
      this.logger.error("Apple token sin sub");
      throw new UnauthorizedException(authResponseConfig.messages.AUTHENTICATION_ERROR);
    }

    return {
      provider: "apple",
      provider_id: payload.sub,
      email: payload.email ?? "",
      first_name: "",
      last_name: undefined,
    };
  }
}
