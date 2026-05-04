

import { applyDecorators, UseGuards } from "@nestjs/common";
import { JwtGuard } from "../../../auth/guards/auth.guard";
import { PermissionGuard } from "../guards/permission.guard";
import { RequirePermissions } from "./require-permissions.decorator";
import { PermissionKey } from "../lib/available-permission";

export const AuthPermissions = (...permissions: PermissionKey[]) => {
  return applyDecorators(
    UseGuards(JwtGuard, PermissionGuard),
    RequirePermissions(...permissions)
  )
}