import { ExecutionContext } from "@nestjs/common";
import { Request, Response } from "express";

import {
  OAUTH_POPUP_COOKIE_NAME,
  OAUTH_POPUP_STATE,
  oauthPopupCookieConfig,
} from "../oauth-popup.config";

export const applyOAuthPopupCookie = (context: ExecutionContext): void => {
  const request = context.switchToHttp().getRequest<Request>();
  const response = context.switchToHttp().getResponse<Response>();

  if (request.query?.popup === "1") {
    response.cookie(OAUTH_POPUP_COOKIE_NAME, "1", oauthPopupCookieConfig);
  }
};

export const isOAuthPopupRequest = (request: Request): boolean =>
  request.cookies?.[OAUTH_POPUP_COOKIE_NAME] === "1" ||
  request.query?.state === OAUTH_POPUP_STATE;

export const consumeOAuthPopupCookie = (request: Request, response: Response): boolean => {
  const isPopup = isOAuthPopupRequest(request);

  if (request.cookies?.[OAUTH_POPUP_COOKIE_NAME] === "1") {
    response.clearCookie(OAUTH_POPUP_COOKIE_NAME, { path: "/" });
  }

  return isPopup;
};

export const getOAuthPopupAuthenticateOptions = (
  request: Request,
): { state: string } | Record<string, never> => {
  if (request.query?.popup === "1") {
    return { state: OAUTH_POPUP_STATE };
  }

  return {};
};
