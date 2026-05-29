import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";

import type { SessionPayload } from "../types/auth.types";
import { authResponseConfig } from "../response.config";

export const GetSessionPayload = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SessionPayload => {
    const req = ctx.switchToHttp().getRequest<Request>();

    if (!req.auth_session_payload) {
      throw new UnauthorizedException(
        authResponseConfig.messages.TWO_FA_CHALLENGE_INVALID,
      );
    }

    return req.auth_session_payload;
  },
);
