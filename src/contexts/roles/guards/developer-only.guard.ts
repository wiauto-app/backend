import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";

@Injectable()
export class DeveloperOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user?.profile?.role) {
      throw new UnauthorizedException("Usuario no autenticado");
    }

    if (user.profile.role.is_developer) {
      return true;
    }

    throw new ForbiddenException("Solo desarrolladores pueden acceder");
  }
}
