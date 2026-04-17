import { Injectable, UnauthorizedException } from "@nestjs/common";
import * as jwt from "jsonwebtoken";
import jwksClient, { JwksClient } from "jwks-rsa";

import { envs } from "@/src/common/envs";
import { OAuthProfile } from "../strategies/google.strategy";

interface AppleIdTokenPayload extends jwt.JwtPayload {
  sub: string;
  email?: string;
}

@Injectable()
export class AppleTokenService {
  private readonly jwks: JwksClient = jwksClient({
    jwksUri: "https://appleid.apple.com/auth/keys",
    cache: true,
    rateLimit: true,
  });

  async verifyIdentityToken(identityToken: string): Promise<OAuthProfile> {
    const decoded = jwt.decode(identityToken, { complete: true });
    if (!decoded || typeof decoded === "string" || !decoded.header.kid) {
      throw new UnauthorizedException("Apple token inválido");
    }

    let publicKey: string;
    try {
      const signingKey = await this.jwks.getSigningKey(decoded.header.kid);
      publicKey = signingKey.getPublicKey();
    } catch {
      throw new UnauthorizedException("No se pudo obtener la clave pública de Apple");
    }

    let payload: AppleIdTokenPayload;
    try {
      payload = jwt.verify(identityToken, publicKey, {
        audience: envs.APPLE_CLIENT_ID,
        issuer: "https://appleid.apple.com",
      }) as AppleIdTokenPayload;
    } catch {
      throw new UnauthorizedException("Apple token expirado o inválido");
    }

    if (!payload.sub) {
      throw new UnauthorizedException("Apple token sin sub");
    }

    return {
      provider: "apple",
      provider_id: payload.sub,
      email: payload.email ?? "",
      first_name: null,
      last_name: null,
    };
  }
}
