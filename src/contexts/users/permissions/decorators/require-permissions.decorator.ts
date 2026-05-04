import { SetMetadata } from "@nestjs/common";
import type { PermissionKey } from "../lib/available-permission";
import { REQUIRED_PERMISSIONS_METADATA_KEY } from "../constants/permission-metadata.constant";

/**
 * Declara los permisos (`PermissionKeys.*`) necesarios para el handler o la clase.
 * Combinar con `JwtGuard` + `PermissionGuard`.
 */
export const RequirePermissions = (...keys: PermissionKey[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_METADATA_KEY, keys);
