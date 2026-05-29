import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";

import { authResponseConfig } from "../response.config";

@Injectable()
export class TwoFactorChallengeScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (request.auth_scope !== "2fa_challenge") {
      throw new UnauthorizedException(
        authResponseConfig.messages.TWO_FA_CHALLENGE_INVALID,
      );
    }

    return true;
  }
}
