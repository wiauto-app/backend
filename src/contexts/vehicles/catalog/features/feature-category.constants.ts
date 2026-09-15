export const FEATURE_UI_CATEGORY_SLUGS = [
  "seguridad_asistentes",
  "aparcamiento",
  "confort",
  "multimedia_conectividad",
  "iluminacion_exterior",
  "interior",
  "conduccion_prestaciones",
  "electricos_hibridos",
] as const;

export type FeatureUiCategorySlug = (typeof FEATURE_UI_CATEGORY_SLUGS)[number];

export const FEATURE_LEFTOVER_CATEGORY_SLUG = "otros";

export type FeatureCategorySlug =
  | FeatureUiCategorySlug
  | typeof FEATURE_LEFTOVER_CATEGORY_SLUG;

export const FEATURE_CATEGORY_STORAGE_SLUGS: FeatureCategorySlug[] = [
  ...FEATURE_UI_CATEGORY_SLUGS,
  FEATURE_LEFTOVER_CATEGORY_SLUG,
];

export const FEATURE_CATEGORY_LABELS: Record<FeatureUiCategorySlug, string> = {
  seguridad_asistentes: "Seguridad y asistentes",
  aparcamiento: "Aparcamiento",
  confort: "Confort",
  multimedia_conectividad: "Multimedia y conectividad",
  iluminacion_exterior: "Iluminación y exterior",
  interior: "Interior",
  conduccion_prestaciones: "Conducción y prestaciones",
  electricos_hibridos: "Eléctricos e híbridos enchufables",
};

export interface FeatureCategoryDefinition {
  slug: FeatureUiCategorySlug;
  label: string;
}

export const FEATURE_CATEGORY_ORDER: FeatureCategoryDefinition[] =
  FEATURE_UI_CATEGORY_SLUGS.map((slug) => ({
    slug,
    label: FEATURE_CATEGORY_LABELS[slug],
  }));
