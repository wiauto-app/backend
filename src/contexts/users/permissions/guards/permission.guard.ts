import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { DataSource } from "typeorm";

import { Roles } from "../../../roles/entities/roles.entity";
import { REQUIRED_PERMISSIONS_METADATA_KEY } from "../constants/permission-metadata.constant";

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly data_source: DataSource,
  ) {}

  private has_permissions(role: Roles, required_permission_keys: string[]): boolean {
    if (required_permission_keys.length === 0) {
      return true;
    }
    const granted_keys = new Set(role.roles_permissions.map((roles_permissions) => roles_permissions.permission.key));
    return required_permission_keys.every((key) => granted_keys.has(key));
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required_permission_keys =
      this.reflector.getAllAndOverride<string[] | undefined>(
        REQUIRED_PERMISSIONS_METADATA_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? [];

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;
    if (!user?.profile) {
      throw new UnauthorizedException("Usuario no autenticado");
    }

    const user_role = user.profile.role;
    if (!user_role) {
      throw new ForbiddenException("Rol no encontrado");
    }

    if (user_role.is_admin || user_role.is_developer) {
      return true;
    }

    if (required_permission_keys.length === 0) {
      return true;
    }

    const role_with_permissions = await this.data_source.getRepository(Roles).findOne({
      where: { id: user_role.id },
      relations: ["roles_permissions", "roles_permissions.permission"],
    });
    if (!role_with_permissions) {
      throw new ForbiddenException("Rol no encontrado");
    }

    if (!this.has_permissions(role_with_permissions, required_permission_keys)) {
      throw new ForbiddenException("Permisos insuficientes");
    }
    return true;
  }
}
