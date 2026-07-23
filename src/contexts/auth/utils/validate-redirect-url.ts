import { BadRequestException, UnauthorizedException } from "@nestjs/common";

import { envs } from "@/src/common/envs";
import { authResponseConfig } from "../response.config";

const normalizeUrl = (url: string): string => url.trim().replace(/\/$/, "");

const isUrlAllowedByBases = (url: string, bases: string[]): boolean => {
  const normalized = normalizeUrl(url);
  const allowed = bases
    .map((value) => value.trim())
    .filter(Boolean)
    .map(normalizeUrl);

  return allowed.some(
    (entry) => normalized === entry || normalized.startsWith(`${entry}/`),
  );
};

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

export const resolvePasswordRecoveryRedirectUrl = (redirectUrl: string): string => {
  const candidate = redirectUrl.trim();

  if (!candidate) {
    throw new BadRequestException("redirect_url es obligatorio");
  }

  if (!isAllowedPasswordRecoveryRedirectUrl(candidate)) {
    throw new BadRequestException("La URL de redirección no está permitida");
  }

  return normalizeUrl(candidate);
};

const isAllowedRedirectUrl = (url: string): boolean =>
  isUrlAllowedByBases(url, [envs.FRONTEND_REDIRECT_URL, envs.FRONTEND_URL]);

const isAllowedPasswordRecoveryRedirectUrl = (url: string): boolean =>
  isUrlAllowedByBases(url, [envs.FRONTEND_URL, envs.DASHBOARD_URL]);

export type OAuthFrontendRedirectOptions = {
  popup?: boolean;
  provider?: "google" | "apple";
};

export const buildOAuthStyleRedirectUrl = (
  baseUrl: string,
  params: { token: string; refresh_token: string; type: string },
  options?: OAuthFrontendRedirectOptions,
): string => {
  const separator = baseUrl.includes("?") ? "&" : "?";
  let url = `${baseUrl}${separator}token=${encodeURIComponent(params.token)}&refresh_token=${encodeURIComponent(params.refresh_token)}&type=${encodeURIComponent(params.type)}`;

  if (options?.popup) {
    url += "&popup=1";
  }

  if (options?.provider) {
    url += `&provider=${encodeURIComponent(options.provider)}`;
  }

  return url;
};

export const buildOAuthFrontendRedirect = (
  tokens: { token: string; refresh_token: string; type: string },
  options?: OAuthFrontendRedirectOptions,
): string =>
  buildOAuthStyleRedirectUrl(envs.FRONTEND_REDIRECT_URL, tokens, options);

export const buildOAuthPopupErrorRedirect = (
  provider: "google" | "apple",
  message?: string,
): string => {
  const baseUrl = envs.FRONTEND_REDIRECT_URL.trim();
  const separator = baseUrl.includes("?") ? "&" : "?";
  let url = `${baseUrl}${separator}popup=1&provider=${encodeURIComponent(provider)}&status=error`;

  if (message) {
    url += `&message=${encodeURIComponent(message)}`;
  }

  return url;
};

export const buildLoginErrorRedirectUrl = (message: string): string => {
  const frontend = normalizeUrl(envs.FRONTEND_URL || "http://localhost:3000");
  return `${frontend}/iniciar-sesion?error=${encodeURIComponent(message)}`;
};
