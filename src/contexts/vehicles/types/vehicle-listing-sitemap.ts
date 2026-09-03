export type VehicleListingSitemapVariant = "catalog" | "with-province";

export interface VehicleListingSitemapEntry {
  makeSlug: string;
  modelSlug: string;
  provinceSlug?: string;
}
