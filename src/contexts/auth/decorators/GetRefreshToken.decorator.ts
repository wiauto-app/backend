import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";



export const GetRefreshToken = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const req = ctx.switchToHttp().getRequest<
      Request & { resolved_refresh_token?: string }
    >();
    if (req.resolved_refresh_token) {
      return req.resolved_refresh_token;
    }
    return (req.cookies?.refresh_token as string | undefined)?.trim() ?? "";
  },
)