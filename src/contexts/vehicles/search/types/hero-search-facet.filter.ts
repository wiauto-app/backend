import type { HeroFacetKind } from "./hero-facet-item";

export interface HeroSearchBaseFilter {
  make_slugs?: string[];
  model_slugs?: string[];
  province_slug?: string;
  municipality_slug?: string;
  until_price?: number;
}

export interface HeroSearchFacetFilter extends HeroSearchBaseFilter {
  facet: HeroFacetKind;
  search?: string;
}
