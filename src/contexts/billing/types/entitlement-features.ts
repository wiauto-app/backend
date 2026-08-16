export const ENTITLEMENT_VALUE_TYPE = {
  BOOLEAN: "boolean",
  LIMIT: "limit",
  UNLIMITED: "unlimited",
} as const;

export type EntitlementValueType =
  (typeof ENTITLEMENT_VALUE_TYPE)[keyof typeof ENTITLEMENT_VALUE_TYPE];

export const ENTITLEMENT_FEATURE = {
  VEHICLES: "vehicles",
  PHOTOS_PER_VEHICLE: "photos_per_vehicle",
  VIDEOS_PER_VEHICLE: "videos_per_vehicle",
  AI_REQUESTS: "ai_requests",
  USERS: "users",
  VIDEO_UPLOAD: "video_upload",
  AI_GENERATION: "ai_generation",
  STATISTICS: "statistics",
  FEATURED_LISTINGS: "featured_listings",
  DISMISSED_VEHICLES: "dismissed_vehicles",
  ADVANCED_LISTING_EDITOR: "advanced_listing_editor",
} as const;

export type EntitlementFeature =
  (typeof ENTITLEMENT_FEATURE)[keyof typeof ENTITLEMENT_FEATURE];

export const LIMIT_FEATURES = [
  ENTITLEMENT_FEATURE.VEHICLES,
  ENTITLEMENT_FEATURE.PHOTOS_PER_VEHICLE,
  ENTITLEMENT_FEATURE.VIDEOS_PER_VEHICLE,
  ENTITLEMENT_FEATURE.AI_REQUESTS,
  ENTITLEMENT_FEATURE.USERS,
] as const;

export const BOOLEAN_FEATURES = [
  ENTITLEMENT_FEATURE.VIDEO_UPLOAD,
  ENTITLEMENT_FEATURE.AI_GENERATION,
  ENTITLEMENT_FEATURE.STATISTICS,
  ENTITLEMENT_FEATURE.FEATURED_LISTINGS,
  ENTITLEMENT_FEATURE.DISMISSED_VEHICLES,
  ENTITLEMENT_FEATURE.ADVANCED_LISTING_EDITOR,
] as const;

export const METERED_FEATURES = [ENTITLEMENT_FEATURE.AI_REQUESTS] as const;

export type MeteredFeature = (typeof METERED_FEATURES)[number];

export interface EntitlementBooleanValue {
  bool: boolean;
}

export interface EntitlementLimitValue {
  limit: number;
}

export interface EntitlementUnlimitedValue {
  unlimited: true;
}

export type EntitlementValue =
  | EntitlementBooleanValue
  | EntitlementLimitValue
  | EntitlementUnlimitedValue;

export interface EntitlementDefinition {
  feature: EntitlementFeature;
  value_type: EntitlementValueType;
  value: EntitlementValue;
}

export interface FeatureCatalogItem {
  feature: EntitlementFeature;
  value_type: EntitlementValueType;
  label: string;
  description: string;
  metered: boolean;
}

export const FEATURE_CATALOG: FeatureCatalogItem[] = [
  {
    feature: ENTITLEMENT_FEATURE.VEHICLES,
    value_type: ENTITLEMENT_VALUE_TYPE.LIMIT,
    label: "Vehículos activos",
    description: "Número máximo de anuncios de vehículos activos",
    metered: false,
  },
  {
    feature: ENTITLEMENT_FEATURE.PHOTOS_PER_VEHICLE,
    value_type: ENTITLEMENT_VALUE_TYPE.LIMIT,
    label: "Fotos por vehículo",
    description: "Número máximo de fotos por anuncio",
    metered: false,
  },
  {
    feature: ENTITLEMENT_FEATURE.VIDEOS_PER_VEHICLE,
    value_type: ENTITLEMENT_VALUE_TYPE.LIMIT,
    label: "Vídeos por vehículo",
    description: "Número máximo de vídeos por anuncio",
    metered: false,
  },
  {
    feature: ENTITLEMENT_FEATURE.AI_REQUESTS,
    value_type: ENTITLEMENT_VALUE_TYPE.LIMIT,
    label: "Consultas de IA",
    description: "Consultas al asistente por periodo de facturación",
    metered: true,
  },
  {
    feature: ENTITLEMENT_FEATURE.USERS,
    value_type: ENTITLEMENT_VALUE_TYPE.LIMIT,
    label: "Usuarios",
    description: "Miembros del concesionario",
    metered: false,
  },
  {
    feature: ENTITLEMENT_FEATURE.VIDEO_UPLOAD,
    value_type: ENTITLEMENT_VALUE_TYPE.BOOLEAN,
    label: "Subida de vídeos",
    description: "Permite subir vídeos a los anuncios",
    metered: false,
  },
  {
    feature: ENTITLEMENT_FEATURE.AI_GENERATION,
    value_type: ENTITLEMENT_VALUE_TYPE.BOOLEAN,
    label: "Generación con IA",
    description: "Acceso a funciones de generación con IA",
    metered: false,
  },
  {
    feature: ENTITLEMENT_FEATURE.STATISTICS,
    value_type: ENTITLEMENT_VALUE_TYPE.BOOLEAN,
    label: "Estadísticas",
    description: "Acceso a estadísticas avanzadas",
    metered: false,
  },
  {
    feature: ENTITLEMENT_FEATURE.FEATURED_LISTINGS,
    value_type: ENTITLEMENT_VALUE_TYPE.BOOLEAN,
    label: "Anuncios destacados",
    description: "Permite destacar anuncios",
    metered: false,
  },
  {
    feature: ENTITLEMENT_FEATURE.DISMISSED_VEHICLES,
    value_type: ENTITLEMENT_VALUE_TYPE.BOOLEAN,
    label: "Vehículos descartados",
    description: "Permite gestionar y listar vehículos descartados",
    metered: false,
  },
  {
    feature: ENTITLEMENT_FEATURE.ADVANCED_LISTING_EDITOR,
    value_type: ENTITLEMENT_VALUE_TYPE.BOOLEAN,
    label: "Editor avanzado de anuncios",
    description: "Acceso a la edición completa de anuncios",
    metered: false,
  },
];

export const FREE_ENTITLEMENTS: EntitlementDefinition[] = [
  // {
  //   feature: ENTITLEMENT_FEATURE.VEHICLES,
  //   value_type: ENTITLEMENT_VALUE_TYPE.LIMIT,
  //   value: { limit: 2 },
  // },
  {
    feature: ENTITLEMENT_FEATURE.VEHICLES,
    value_type: ENTITLEMENT_VALUE_TYPE.LIMIT,
    value: { limit: 2 },
  },
  {
    feature: ENTITLEMENT_FEATURE.PHOTOS_PER_VEHICLE,
    value_type: ENTITLEMENT_VALUE_TYPE.LIMIT,
    value: { limit: 10 },
  },
  {
    feature: ENTITLEMENT_FEATURE.VIDEOS_PER_VEHICLE,
    value_type: ENTITLEMENT_VALUE_TYPE.LIMIT,
    value: { limit: 0 },
  },
  {
    feature: ENTITLEMENT_FEATURE.AI_REQUESTS,
    value_type: ENTITLEMENT_VALUE_TYPE.LIMIT,
    value: { limit: 0 },
  },
  {
    feature: ENTITLEMENT_FEATURE.USERS,
    value_type: ENTITLEMENT_VALUE_TYPE.LIMIT,
    value: { limit: 1 },
  },
  {
    feature: ENTITLEMENT_FEATURE.VIDEO_UPLOAD,
    value_type: ENTITLEMENT_VALUE_TYPE.BOOLEAN,
    value: { bool: false },
  },
  {
    feature: ENTITLEMENT_FEATURE.AI_GENERATION,
    value_type: ENTITLEMENT_VALUE_TYPE.BOOLEAN,
    value: { bool: false },
  },
  {
    feature: ENTITLEMENT_FEATURE.STATISTICS,
    value_type: ENTITLEMENT_VALUE_TYPE.BOOLEAN,
    value: { bool: false },
  },
  {
    feature: ENTITLEMENT_FEATURE.FEATURED_LISTINGS,
    value_type: ENTITLEMENT_VALUE_TYPE.BOOLEAN,
    value: { bool: false },
  },
  {
    feature: ENTITLEMENT_FEATURE.DISMISSED_VEHICLES,
    value_type: ENTITLEMENT_VALUE_TYPE.BOOLEAN,
    value: { bool: false },
  },
  {
    feature: ENTITLEMENT_FEATURE.ADVANCED_LISTING_EDITOR,
    value_type: ENTITLEMENT_VALUE_TYPE.BOOLEAN,
    value: { bool: false },
  },
];

export const isEntitlementFeature = (value: string): value is EntitlementFeature =>
  FEATURE_CATALOG.some((item) => item.feature === value);

export const isMeteredFeature = (feature: string): feature is MeteredFeature =>
  (METERED_FEATURES as readonly string[]).includes(feature);

export const booleanValue = (bool: boolean): EntitlementBooleanValue => ({ bool });

export const limitValue = (limit: number): EntitlementLimitValue => ({ limit });

export const unlimitedValue = (): EntitlementUnlimitedValue => ({ unlimited: true });
