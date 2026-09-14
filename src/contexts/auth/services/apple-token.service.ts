import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import * as jwt from "jsonwebtoken";
import jwksClient, { JwksClient } from "jwks-rsa";

import { envs } from "@/src/common/envs";
import { CryptoService } from "@/src/contexts/2fa/services/crypto.service";
import { UserAuthProvider } from "@/src/contexts/users/entities/user-auth-provider.entity";
import { UserAuthProviderService } from "@/src/contexts/users/services/user-auth-provider.service";
import { OAuthProfile } from "../strategies/google.strategy";
import { authResponseConfig } from "../response.config";

interface AppleIdTokenPayload extends jwt.JwtPayload {
  sub: string;
  email?: string;
}

interface AppleTokenResponse {
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: string;
}

interface ExchangeAndPersistRefreshTokenInput {
  authorization_code: string;
  identity_token: string;
  provider_id: string;
}

@Injectable()
export class AppleTokenService {
  private readonly logger = new Logger(AppleTokenService.name);
  private readonly jwks: JwksClient = jwksClient({
    jwksUri: "https://appleid.apple.com/auth/keys",
    cache: true,
    rateLimit: true,
  });

  constructor(
    private readonly userAuthProviderService: UserAuthProviderService,
    private readonly cryptoService: CryptoService,
  ) {}

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

  async exchangeAndPersistRefreshToken(
    input: ExchangeAndPersistRefreshTokenInput,
  ): Promise<void> {
    try {
      const clientId = this.resolveClientIdFromIdentityToken(input.identity_token);
      if (!clientId) {
        this.logger.warn("Apple authorization_code sin client_id resoluble");
        return;
      }

      const refreshToken = await this.exchangeAuthorizationCode(
        input.authorization_code,
        clientId,
      );
      if (!refreshToken) {
        return;
      }

      const encrypted = this.cryptoService.encrypt(refreshToken);
      await this.userAuthProviderService.storeEncryptedRefreshToken({
        provider: "apple",
        provider_id: input.provider_id,
        refresh_token_encrypted: encrypted,
        oauth_client_id: clientId,
      });
    } catch (error) {
      this.logger.warn(
        "No se pudo intercambiar o guardar el refresh token de Apple",
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async revokeStoredRefreshToken(identity: UserAuthProvider | null): Promise<void> {
    if (!identity?.refresh_token_encrypted) {
      return;
    }

    let refreshToken: string;
    try {
      refreshToken = this.cryptoService.decrypt(identity.refresh_token_encrypted);
    } catch (error) {
      this.logger.warn(
        "No se pudo descifrar el refresh token de Apple",
        error instanceof Error ? error.message : String(error),
      );
      return;
    }

    const clientIds = this.buildRevokeClientIds(identity.oauth_client_id);
    for (const clientId of clientIds) {
      const revoked = await this.revokeRefreshToken(refreshToken, clientId);
      if (revoked) {
        return;
      }
    }

    this.logger.warn("Apple no revocó el refresh token con ningún client_id");
  }

  private resolveClientIdFromIdentityToken(identityToken: string): string | null {
    const decoded = jwt.decode(identityToken);
    if (!decoded || typeof decoded === "string") {
      return null;
    }

    const audiences = this.normalizeAudiences(decoded.aud);
    const allowed: string[] = this.allowedAudiences ?? [];
    const matched = audiences.find((audience) => allowed.includes(audience));
    return matched ?? audiences[0] ?? null;
  }

  private normalizeAudiences(aud: string | string[] | undefined): string[] {
    if (!aud) {
      return [];
    }
    return (Array.isArray(aud) ? aud : [aud])
      .map((audience) => audience.trim())
      .filter((audience) => audience.length > 0);
  }

  private buildRevokeClientIds(storedClientId: string | null): string[] {
    const ids = [
      storedClientId,
      envs.APPLE_APP_BUNDLE_ID,
      envs.APPLE_CLIENT_ID,
    ]
      .map((id) => id?.trim() ?? "")
      .filter((id) => id.length > 0);

    return [...new Set(ids)];
  }

  private getApplePrivateKey(): string | null {
    const privateKey = envs.APPLE_PRIVATE_KEY.replaceAll(String.raw`\n`, "\n").trim();
    if (!privateKey || !envs.APPLE_TEAM_ID.trim() || !envs.APPLE_KEY_ID.trim()) {
      return null;
    }
    return privateKey;
  }

  private createClientSecret(clientId: string): string | null {
    const privateKey = this.getApplePrivateKey();
    if (!privateKey) {
      this.logger.warn("Apple Sign in sin TEAM_ID, KEY_ID o PRIVATE_KEY");
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    return jwt.sign(
      {
        iss: envs.APPLE_TEAM_ID.trim(),
        iat: now,
        exp: now + 60 * 5,
        aud: "https://appleid.apple.com",
        sub: clientId,
      },
      privateKey,
      {
        algorithm: "ES256",
        keyid: envs.APPLE_KEY_ID.trim(),
      },
    );
  }

  private async exchangeAuthorizationCode(
    authorizationCode: string,
    clientId: string,
  ): Promise<string | null> {
    const clientSecret = this.createClientSecret(clientId);
    if (!clientSecret) {
      return null;
    }

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: authorizationCode,
      grant_type: "authorization_code",
    });

    const response = await fetch("https://appleid.apple.com/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const payload = (await response.json()) as AppleTokenResponse;
    if (!response.ok || !payload.refresh_token) {
      this.logger.warn(
        `Apple token exchange falló (${response.status}): ${payload.error ?? "sin refresh_token"}`,
      );
      return null;
    }

    return payload.refresh_token;
  }

  private async revokeRefreshToken(
    refreshToken: string,
    clientId: string,
  ): Promise<boolean> {
    const clientSecret = this.createClientSecret(clientId);
    if (!clientSecret) {
      return false;
    }

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      token: refreshToken,
      token_type_hint: "refresh_token",
    });

    const response = await fetch("https://appleid.apple.com/auth/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!response.ok) {
      this.logger.warn(`Apple revoke falló (${response.status}) con client_id ${clientId}`);
      return false;
    }

    return true;
  }
}
