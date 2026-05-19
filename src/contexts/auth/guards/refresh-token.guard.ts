import { CanActivate, ExecutionContext } from "@nestjs/common";
import { Request } from "express";
import { RefreshTokenService } from "../services/refresh-token.service";


export class RefreshTokenGuard implements CanActivate {
  constructor(
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const from_cookie =
      (request.cookies.refresh_token as string | undefined)?.trim() ?? "";
    const refresh_token = from_cookie;
    if (!refresh_token) {
      return false;
    }
    request.refresh_token = refresh_token;
    return true;
  }
}