import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";

export const GetUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const req = ctx.switchToHttp().getRequest<Request>();
    if (!req.user) {
      throw new UnauthorizedException("User not found");
    }
    return req.user.id;
  },
);