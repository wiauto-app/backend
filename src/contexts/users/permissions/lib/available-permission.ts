/**
 * Archivo generado automáticamente — no editar a mano.
 * Regenerar: PermissionService.sync_available_permission_keys_file()
 * o POST /v1/permissions/sync-available-keys-file (JWT).
 *
 * Uso en endpoints: JwtGuard + PermissionGuard + @RequirePermissions(PermissionKeys.XXX).
 * Generado: 2026-05-15T01:29:47.054Z
 */

export const PermissionKeys = {
  DEALERSHIPINVITATIONS_CREATE: "dealership_invitations.create",
  DEALERSHIPINVITATIONS_DELETE: "dealership_invitations.delete",
  DEALERSHIP_CREATE: "dealership.create",
  DEALERSHIP_DELETE: "dealership.delete",
  DEALERSHIP_UPDATE: "dealership.update",
  PERMISSIONS_MANAGE: "permissions.manage",
  ROLES_MANAGE: "roles.manage",
  SUSPENSION_MANAGE: "suspension.manage",
  USERS_CREATE: "users.create",
  VEHICLES_CREATE: "vehicles.create",
  VEHICLES_FEATURED_MONTHLY: "vehicles.featured_monthly",
  VEHICLES_MAX_PHOTOS: "vehicles.max_photos",
  ALERTS_MAX_ACTIVE: "alerts.max_active",
  ANALYTICS_VIEW: "analytics.view",
  VEHICLES_BOOST: "vehicles.boost",
  BILLING_MANAGE: "billing.manage",
} as const;

export type PermissionKey =
  (typeof PermissionKeys)[keyof typeof PermissionKeys];
