import type { HeroFacetKind } from "../read-models/hero-facet-item";

export interface HeroSearchFacetFilter {
  facet: HeroFacetKind;
  search?: string;
  make_slugs?: string[];
  model_slugs?: string[];
  province_slug?: string;
  municipality_slug?: string;
  until_price?: number;
};
