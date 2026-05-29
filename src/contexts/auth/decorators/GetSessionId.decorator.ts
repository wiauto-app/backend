import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";

import { authResponseConfig } from "../response.config";

export const GetSessionId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest<Request>();
    if (!req.auth_session_id) {
      throw new UnauthorizedException(authResponseConfig.messages.SESSION_NOT_FOUND);
    }
    return req.auth_session_id;
  },
);
