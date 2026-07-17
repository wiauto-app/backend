import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { RequirePermissions } from "@/src/contexts/users/permissions/decorators/require-permissions.decorator";
import { PermissionKeys } from "@/src/contexts/users/permissions/lib/available-permission";
import { PermissionGuard } from "@/src/contexts/users/permissions/guards/permission.guard";
import { applyDecorators, UseGuards } from "@nestjs/common";
import { VehicleCreationGuard } from "../guards/vehicleCreation.guard";

/** JWT + permiso `vehicles.create` + cuota según `value` del permiso en BD. */
export const CreateVehicleAuth = () =>
  applyDecorators(
    UseGuards(JwtGuard, PermissionGuard, VehicleCreationGuard),
    RequirePermissions(PermissionKeys.VEHICLES_CREATE),
  );
