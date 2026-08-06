import { envs } from "@/src/common/envs";
import { CookieOptions } from "express";

/** Cookies de la plataforma (frontend). El dashboard usa `admin-cookie.config`. */
export const REFRESH_TOKEN_NAME = "refresh_token";
export const ACCESS_TOKEN_NAME = "access_token";

const FIFTEEN_MINUTES = 1000 * 60 * 15;
const MONTH = 1000 * 60 * 60 * 24 * 30;

export const authCookieConfig: Record<string, CookieOptions> = {
  refresh_token: {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    domain: envs.ENVIRONMENT === "development" ? "localhost" : '.wiauto.es',
    path: "/",
    maxAge: MONTH,
  },

  access_token: {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    domain: envs.ENVIRONMENT === "development" ? "localhost" : '.wiauto.es',
    path: "/",
    maxAge: FIFTEEN_MINUTES,
  },
};