export type HeroFacetKind =
  | "makes"
  | "models"
  | "provinces"
  | "municipalities"
  | "price_ranges";

export type HeroCatalogFacetItem = {
  id: number;
  slug: string;
  name: string;
  vehicle_count: number;
  /** Presente solo cuando facet=models */
  make_id?: number;
};

export type HeroPriceRangeFacetItem = {
  until_price: number;
  label: string;
  vehicle_count: number;
};

export type HeroFacetItem = HeroCatalogFacetItem | HeroPriceRangeFacetItem;

export type HeroFacetsResult = {
  facet: HeroFacetKind;
  items: HeroFacetItem[];
};
