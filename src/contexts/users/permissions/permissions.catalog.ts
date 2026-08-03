/**
 * Catálogo fijo de permisos (capacidades). Fuente de verdad en código.
 * Las cuotas (anuncios, fotos, vídeos) viven en el plan, no en `permissions.value`.
 */

export interface PermissionDefinition {
  key: string;
  name: string;
  description: string;
  kind: "capability";
}

export const PERMISSIONS_CATALOG: PermissionDefinition[] = [
  {
    key: "dealership_invitations.create",
    name: "Crear invitaciones de concesionario",
    description: "Permite invitar miembros a un concesionario.",
    kind: "capability",
  },
  {
    key: "dealership_invitations.delete",
    name: "Eliminar invitaciones de concesionario",
    description: "Permite cancelar invitaciones pendientes.",
    kind: "capability",
  },
  {
    key: "dealership.create",
    name: "Crear concesionario",
    description: "Permite crear un concesionario.",
    kind: "capability",
  },
  {
    key: "dealership.delete",
    name: "Eliminar concesionario",
    description: "Permite eliminar un concesionario.",
    kind: "capability",
  },
  {
    key: "dealership.update",
    name: "Actualizar concesionario",
    description: "Permite editar datos del concesionario.",
    kind: "capability",
  },
  {
    key: "permissions.manage",
    name: "Gestionar permisos",
    description: "Permite administrar el catálogo y asignaciones de permisos.",
    kind: "capability",
  },
  {
    key: "roles.manage",
    name: "Gestionar roles",
    description: "Permite crear y editar roles.",
    kind: "capability",
  },
  {
    key: "suspension.manage",
    name: "Gestionar suspensiones",
    description: "Permite suspender o rehabilitar cuentas.",
    kind: "capability",
  },
  {
    key: "users.create",
    name: "Crear usuarios",
    description: "Permite crear usuarios del sistema.",
    kind: "capability",
  },
  {
    key: "vehicles.create",
    name: "Crear anuncios",
    description: "Permite publicar anuncios de vehículos (capacidad; la cuota está en el plan).",
    kind: "capability",
  },
  {
    key: "analytics.view",
    name: "Ver analíticas",
    description: "Permite consultar métricas y analíticas.",
    kind: "capability",
  },
  {
    key: "vehicles.boost",
    name: "Impulsar anuncios",
    description: "Permite usar impulsos o destacados del plan.",
    kind: "capability",
  },
  {
    key: "billing.manage",
    name: "Gestionar facturación",
    description: "Permite administrar planes, precios y suscripciones.",
    kind: "capability",
  },
];

export const PERMISSION_CATALOG_BY_KEY = new Map(
  PERMISSIONS_CATALOG.map((item) => [item.key, item]),
);
