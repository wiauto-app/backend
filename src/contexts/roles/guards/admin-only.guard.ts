import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";

@Injectable()
export class AdminOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user?.profile?.role) {
      throw new UnauthorizedException("Usuario no autenticado");
    }

    const role = user.profile.role;
    if (role.is_admin || role.is_developer) {
      return true;
    }

    throw new ForbiddenException("Solo administradores y desarrolladores pueden acceder");
  }
}
