import { applyDecorators, UseGuards } from "@nestjs/common";
import { JwtGuard } from "../../../auth/guards/auth.guard";
import { PermissionGuard } from "../guards/permission.guard";
import { PermissionKey } from "../lib/available-permission";
import { RequirePermissions } from "./require-permissions.decorator";

export const AuthPermissions = (...permissions: PermissionKey[]) => {
  return applyDecorators(
    UseGuards(JwtGuard, PermissionGuard),
    RequirePermissions(...permissions),
  );
};