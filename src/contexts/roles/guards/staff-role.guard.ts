import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";

import { REQUIRE_STAFF_ROLE_METADATA_KEY } from "../constants/staff-role-metadata.constant";

@Injectable()
export class StaffRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const require_staff = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_STAFF_ROLE_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!require_staff) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;
    if (!user?.profile) {
      throw new UnauthorizedException("Usuario no autenticado");
    }

    const role = user.profile.role;
    if (!role) {
      throw new ForbiddenException("Se requiere un rol asignado");
    }

    if (role.is_admin || role.is_developer) {
      return true;
    }

    throw new ForbiddenException("Solo personal administrativo o desarrollo puede acceder");
  }
}
