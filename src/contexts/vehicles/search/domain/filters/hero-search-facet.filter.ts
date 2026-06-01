import type { HeroFacetKind } from "../read-models/hero-facet-item";

export type HeroSearchFacetFilter = {
  facet: HeroFacetKind;
  search?: string;
  make_slug?: string;
  model_slug?: string;
  province_slug?: string;
  municipality_slug?: string;
  until_price?: number;
};
