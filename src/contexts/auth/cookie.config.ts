import { CookieOptions } from "express";

export const REFRESH_TOKEN_NAME = "refresh_token";
export const ACCESS_TOKEN_NAME = "access_token";

const FIFTEEN_MINUTES = 1000 * 60 * 15;
const MONTH = 1000 * 60 * 60 * 24 * 30;

export const authCookieConfig: Record<string, CookieOptions> = {
  refresh_token: {
    httpOnly: true,
    secure: true,
    sameSite: "none" as const,
    path: "/",
    maxAge: MONTH,
  },

  access_token: {
    httpOnly: true,
    secure: true,
    sameSite: "none" as const,
    path: "/",
    maxAge: FIFTEEN_MINUTES,
  },
};