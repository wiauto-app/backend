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

  async verifyIdentityToken(identityToken: string): Promise<OAuthProfile> {
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
        audience: envs.APPLE_CLIENT_ID,
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
