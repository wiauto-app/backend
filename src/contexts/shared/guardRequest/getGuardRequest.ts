import { ExecutionContext } from "@nestjs/common";
import { Request } from "express";
import { User } from "../../users/entities/user.entity";


export const getGuardRequest = (context: ExecutionContext): { request: Request, user?: User } => {
  const request = context.switchToHttp().getRequest<Request>();
  return { request, user: request.user };
};