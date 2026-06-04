import { UnauthorizedException } from "@nestjs/common";

import { envs } from "@/src/common/envs";
import { authResponseConfig } from "../response.config";

const normalizeUrl = (url: string): string => url.trim().replace(/\/$/, "");

export const resolveEmailVerificationRedirectUrl = (
  redirectUrl?: string,
): string => {
  const candidate = (redirectUrl ?? envs.FRONTEND_REDIRECT_URL).trim();

  if (!candidate) {
    throw new UnauthorizedException(authResponseConfig.messages.AUTHENTICATION_ERROR);
  }

  if (!isAllowedRedirectUrl(candidate)) {
    throw new UnauthorizedException(authResponseConfig.messages.AUTHENTICATION_ERROR);
  }

  return candidate;
};

const isAllowedRedirectUrl = (url: string): boolean => {
  const normalized = normalizeUrl(url);
  const allowed = [
    envs.FRONTEND_REDIRECT_URL,
    envs.FRONTEND_URL,
  ]
    .map((value) => value.trim())
    .filter(Boolean)
    .map(normalizeUrl);

  return allowed.some(
    (entry) => normalized === entry || normalized.startsWith(`${entry}/`),
  );
};

export const buildOAuthStyleRedirectUrl = (
  baseUrl: string,
  params: { token: string; refresh_token: string; type: string },
): string => {
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}token=${encodeURIComponent(params.token)}&refresh_token=${encodeURIComponent(params.refresh_token)}&type=${encodeURIComponent(params.type)}`;
};

export const buildLoginErrorRedirectUrl = (message: string): string => {
  const frontend = normalizeUrl(envs.FRONTEND_URL || "http://localhost:3000");
  return `${frontend}/iniciar-sesion?error=${encodeURIComponent(message)}`;
};
