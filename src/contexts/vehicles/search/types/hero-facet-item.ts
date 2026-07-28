export type HeroFacetKind =
  | "makes"
  | "models"
  | "provinces"
  | "municipalities"
  | "price_ranges";

export interface HeroCatalogFacetItem {
  id: number;
  slug: string;
  name: string;
  vehicle_count: number;
  /** Presente solo cuando facet=models */
  make_id?: number;
  /** Presente solo cuando facet=models */
  make_slug?: string;
  /** Presente solo cuando facet=models */
  make_name?: string;
}

export interface HeroPriceRangeFacetItem {
  until_price: number;
  label: string;
  vehicle_count: number;
}

export type HeroFacetItem = HeroCatalogFacetItem | HeroPriceRangeFacetItem;

export interface HeroFacetsResult {
  facet: HeroFacetKind;
  items: HeroFacetItem[];
}
