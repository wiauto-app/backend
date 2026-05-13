import {
  applyDecorators,
  Type,
  UseGuards,
} from "@nestjs/common";
import type { CanActivate } from "@nestjs/common";

import { JwtGuard } from "../../../auth/guards/auth.guard";
import { PermissionGuard } from "../guards/permission.guard";
import { PermissionKey } from "../lib/available-permission";
import { RequirePermissions } from "./require-permissions.decorator";

export type AuthPermissionsExtraGuard = Type<CanActivate>;

export interface AuthPermissionsOptions {
  permissions: PermissionKey[];
  extraGuards?: AuthPermissionsExtraGuard[];
}

/** Solo permisos (JwtGuard + PermissionGuard). */
export function AuthPermissions(
  ...permissions: PermissionKey[]
): MethodDecorator & ClassDecorator;

/** Permisos + guards adicionales (orden: JwtGuard, PermissionGuard, …extras). */
export function AuthPermissions(
  options: AuthPermissionsOptions,
): MethodDecorator & ClassDecorator;

export function AuthPermissions(
  first: PermissionKey | AuthPermissionsOptions,
  ...rest: PermissionKey[]
): MethodDecorator & ClassDecorator {
  if (typeof first === "object" && "permissions" in first) {
    const { permissions, extraGuards = [] } = first;
    return applyDecorators(
      UseGuards(JwtGuard, PermissionGuard, ...extraGuards),
      RequirePermissions(...permissions),
    );
  }

  const permissions = [first, ...rest];
  return applyDecorators(
    UseGuards(JwtGuard, PermissionGuard),
    RequirePermissions(...permissions),
  );
}
