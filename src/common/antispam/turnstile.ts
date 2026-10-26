import {
  BadRequestException,
  CanActivate,
  type ExecutionContext,
  Logger,
} from "@nestjs/common";
import type { Request } from "express";

import { envs } from "@/src/common/envs";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { resolveClientIp } from "../client-ip";
import { isHoneypotBodyFilled } from "./honeypot";

export const TURNSTILE_FIELD = "turnstile_token";
const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileSiteverifyResponse {
  success: boolean;
  "error-codes"?: string[];
}

export const isTurnstileVerificationEnabled = (): boolean =>
  Boolean(envs.TURNSTILE_SECRET_KEY.trim());

const readTurnstileToken = (body: unknown): string | null => {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const value: unknown = (body as Record<string, unknown>)[TURNSTILE_FIELD];
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const verifyTurnstileToken = async (
  token: string,
  remote_ip?: string,
): Promise<boolean> => {
  const secret = envs.TURNSTILE_SECRET_KEY.trim();
  if (!secret) {
    return true;
  }

  const payload = new URLSearchParams({
    secret,
    response: token,
  });

  if (remote_ip) {
    payload.set("remoteip", remote_ip);
  }

  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: payload.toString(),
    });

    if (!response.ok) {
      return false;
    }

    const body = (await response.json()) as TurnstileSiteverifyResponse;
    return body.success;
  } catch {
    return false;
  }
};

@Injectable()
export class TurnstileGuard implements CanActivate {
  private readonly logger = new Logger(TurnstileGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!isTurnstileVerificationEnabled()) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const body: unknown = request.body;

    if (isHoneypotBodyFilled(body)) {
      return true;
    }

    const token = readTurnstileToken(body);
    if (!token) {
      throw new BadRequestException(
        "Completa la verificación de seguridad antes de enviar",
      );
    }

    const is_valid = await verifyTurnstileToken(token, resolveClientIp(request));
    if (!is_valid) {
      this.logger.warn(
        `Turnstile inválido en ${request.method} ${request.originalUrl} (ip=${resolveClientIp(request)})`,
      );
      throw new BadRequestException(
        "La verificación de seguridad no es válida. Inténtalo de nuevo.",
      );
    }

    return true;
  }
}
