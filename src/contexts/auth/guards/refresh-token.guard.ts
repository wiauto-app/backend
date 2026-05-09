import { CanActivate, ExecutionContext } from "@nestjs/common";
import { Request } from "express";
import { RefreshTokenService } from "../services/refresh-token.service";


export class RefreshTokenGuard implements CanActivate {
  constructor(
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const refreshToken = (request.cookies.refresh_token as string | undefined)?.trim() ?? "";
    if (!refreshToken) {
      return false;
    }
    return true;
  }
}