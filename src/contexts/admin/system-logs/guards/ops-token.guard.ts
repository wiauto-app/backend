import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";

import { envs } from "@/src/common/envs";

import { isValidOpsToken, OPS_TOKEN_HEADER } from "../utils/ops-token";

/**
 * Acceso a endpoints de operación con un token estático (`OPS_TOKEN`) en la
 * cabecera `X-Ops-Token`, sin sesión de usuario. Sin token configurado el
 * endpoint responde 404 para no revelar que existe.
 */
@Injectable()
export class OpsTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (envs.OPS_TOKEN === "") {
      throw new NotFoundException();
    }

    const request = context.switchToHttp().getRequest<Request>();
    if (!isValidOpsToken(request.headers[OPS_TOKEN_HEADER], envs.OPS_TOKEN)) {
      throw new UnauthorizedException("Token de operación inválido");
    }

    return true;
  }
}
