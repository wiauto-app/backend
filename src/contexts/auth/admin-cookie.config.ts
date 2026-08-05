import { CookieOptions } from "express";

/** Cookies propias del dashboard admin — no reutilizar las de la plataforma. */
export const ADMIN_REFRESH_TOKEN_NAME = "wiauto_admin_refresh_token";
export const ADMIN_ACCESS_TOKEN_NAME = "wiauto_admin_access_token";

const FIFTEEN_MINUTES = 1000 * 60 * 15;
const MONTH = 1000 * 60 * 60 * 24 * 30;

const base_admin_cookie_options: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
};

export const adminAuthCookieConfig: Record<
  "refresh_token" | "access_token",
  CookieOptions
> = {
  refresh_token: {
    ...base_admin_cookie_options,
    maxAge: MONTH,
  },
  access_token: {
    ...base_admin_cookie_options,
    maxAge: FIFTEEN_MINUTES,
  },
};
