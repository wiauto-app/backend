import type { HeroFacetKind } from "../domain/read-models/hero-facet-item";

export type GetHeroFacetsDto = {
  facet: HeroFacetKind;
  search?: string;
  make_slug?: string;
  model_slug?: string;
  province_slug?: string;
  municipality_slug?: string;
  until_price?: number;
};
