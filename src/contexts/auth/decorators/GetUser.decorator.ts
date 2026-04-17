import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";
import { User } from "../../users/entities/user.entity";


export const GetUser = createParamDecorator(
  (data: string, ctx: ExecutionContext): User | undefined => {
    const req = ctx.switchToHttp().getRequest<Request>()
    if (!req.user) {
      return undefined
    }
    return req.user
  }
)