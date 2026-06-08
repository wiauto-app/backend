import { CookieOptions } from "express";

export const OAUTH_POPUP_COOKIE_NAME = "oauth_popup";

const FIVE_MINUTES = 1000 * 60 * 5;

export const oauthPopupCookieConfig: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: FIVE_MINUTES,
};

export const OAUTH_POPUP_STATE = "wiauto_popup";
