import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";



export const GetRefreshToken = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return (req.cookies.refresh_token as string | undefined)?.trim() ?? "";
  },
)