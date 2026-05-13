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
      (request.cookies?.refresh_token as string | undefined)?.trim() ?? "";
    const body = request.body as { refresh_token?: string } | undefined;
    const from_body =
      typeof body?.refresh_token === "string" ? body.refresh_token.trim() : "";
    const refresh_token = from_cookie || from_body;
    if (!refresh_token) {
      return false;
    }
    (request as Request & { resolved_refresh_token: string }).resolved_refresh_token =
      refresh_token;
    return true;
  }
}