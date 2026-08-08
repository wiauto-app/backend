import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { getGuardRequest } from "@/src/contexts/shared/guardRequest/getGuardRequest";

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = getGuardRequest(context);

    if (!user) {
      throw new UnauthorizedException("Usuario no autenticado");
    }

    if (user.is_admin) {
      return true;
    }

    throw new ForbiddenException("Solo administradores pueden acceder");
  }
}
