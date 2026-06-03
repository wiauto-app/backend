import type { HeroFacetKind } from "../domain/read-models/hero-facet-item";

export interface GetHeroFacetsDto {
  facet: HeroFacetKind;
  search?: string;
  make_slugs?: string[];
  model_slugs?: string[];
  province_slug?: string;
  municipality_slug?: string;
  until_price?: number;
};
