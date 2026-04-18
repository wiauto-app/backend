import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Request } from "express";

import { UserResponse } from "../../auth/types/auth.types";
import { TwoFactorAuthService } from "../services/2fa.service";
import { TwofaDto } from "../dto/2fa.dto";

type RequestWithSession = Request & { user?: UserResponse };

@Injectable()
export class TwoFactorGuard implements CanActivate {

  constructor(
    private readonly twoFactorAuthService: TwoFactorAuthService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithSession>();
    const session = request.user;
    const body = request.body as TwofaDto;
    if(!body.code || !session?.user) {
      return false;
    }

    const verified = await this.twoFactorAuthService.verify(session.user.id, body);
    return verified.verified;
  }
}