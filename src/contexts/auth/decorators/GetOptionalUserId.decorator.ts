import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";

export const GetOptionalUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return req.user?.id;
  },
);
