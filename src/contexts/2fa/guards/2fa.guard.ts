import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Request } from "express";

import { TwoFactorAuthService } from "../services/2fa.service";
import { TwofaDto } from "../dto/2fa.dto";


@Injectable()
export class TwoFactorGuard implements CanActivate {

  constructor(
    private readonly twoFactorAuthService: TwoFactorAuthService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;
    const body = request.body as TwofaDto;
    if(!body.code || !user) {
      return false;
    }

    const verified = await this.twoFactorAuthService.verify(user.id, body);
    return verified.verified;
  }
}