import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";

import { UserResponse } from "../types/auth.types";

type RequestWithSession = Request & { user?: UserResponse };

export const GetUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserResponse | undefined => {
    const req = ctx.switchToHttp().getRequest<RequestWithSession>();
    return req.user;
  },
);