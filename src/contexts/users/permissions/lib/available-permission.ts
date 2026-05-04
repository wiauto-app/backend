/**
 * Archivo generado automáticamente — no editar a mano.
 * Regenerar: PermissionService.sync_available_permission_keys_file()
 * o POST /v1/permissions/sync-available-keys-file (JWT).
 *
 * Uso en endpoints: JwtGuard + PermissionGuard + @RequirePermissions(PermissionKeys.XXX).
 * Generado: 2026-05-03T04:59:45.003Z
 */

export const PermissionKeys = {
  PERMISSIONS_MANAGE: "permissions.manage",
  ROLES_MANAGE: "roles.manage",
  USERS_CREATE: "users.create",
  /** Crear anuncio; el campo `value` en BD define la cuota máxima de vehículos activos por perfil (planes). */
  VEHICLES_CREATE: "vehicles.create",
} as const;

export type PermissionKey =
  (typeof PermissionKeys)[keyof typeof PermissionKeys];
