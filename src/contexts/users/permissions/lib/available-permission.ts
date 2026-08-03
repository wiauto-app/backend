/**
 * Claves de permiso alineadas con `permissions.catalog.ts`.
 * Tras sync a BD, también se puede regenerar con POST /v1/permissions/sync-available-keys-file.
 */

export const PermissionKeys = {
  ANALYTICS_VIEW: "analytics.view",
  BILLING_MANAGE: "billing.manage",
  DEALERSHIPINVITATIONS_CREATE: "dealership_invitations.create",
  DEALERSHIPINVITATIONS_DELETE: "dealership_invitations.delete",
  DEALERSHIP_CREATE: "dealership.create",
  DEALERSHIP_DELETE: "dealership.delete",
  DEALERSHIP_UPDATE: "dealership.update",
  PERMISSIONS_MANAGE: "permissions.manage",
  ROLES_MANAGE: "roles.manage",
  SUSPENSION_MANAGE: "suspension.manage",
  USERS_CREATE: "users.create",
  VEHICLES_BOOST: "vehicles.boost",
  VEHICLES_CREATE: "vehicles.create",
} as const;

export type PermissionKey =
  (typeof PermissionKeys)[keyof typeof PermissionKeys];
