import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Request } from "express";

import { ADMIN_REFRESH_TOKEN_NAME } from "../admin-cookie.config";
import { REFRESH_TOKEN_NAME } from "../cookie.config";
import { isAdminAuthRequest } from "../utils/is-admin-auth-request";

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const cookies = request.cookies as Record<string, string | undefined> | undefined;

    const cookie_name = isAdminAuthRequest(request)
      ? ADMIN_REFRESH_TOKEN_NAME
      : REFRESH_TOKEN_NAME;
    const refresh_token = cookies?.[cookie_name]?.trim() ?? "";
    if (!refresh_token) {
      return false;
    }
    request.refresh_token = refresh_token;
    return true;
  }
}
