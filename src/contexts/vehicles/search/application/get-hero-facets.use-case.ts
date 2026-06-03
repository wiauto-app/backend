import { BadRequestException } from "@nestjs/common";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import type { HeroSearchFacetFilter } from "../domain/filters/hero-search-facet.filter";
import type { HeroFacetsResult } from "../domain/read-models/hero-facet-item";
import { HeroSearchRepository } from "../domain/ports/hero-search.repository";
import { GetHeroFacetsDto } from "./get-hero-facets.dto";

@Injectable()
export class GetHeroFacetsUseCase {
  constructor(private readonly hero_search_repository: HeroSearchRepository) {}

  async execute(dto: GetHeroFacetsDto): Promise<HeroFacetsResult> {
    if (dto.facet === "models" && !dto.make_slugs?.length) {
      throw new BadRequestException(
        "make_slug es obligatorio cuando facet=models",
      );
    }

    if (dto.facet === "municipalities" && !dto.province_slug?.trim()) {
      throw new BadRequestException(
        "province_slug es obligatorio cuando facet=municipalities",
      );
    }

    const filter: HeroSearchFacetFilter = {
      facet: dto.facet,
      search: dto.search,
      make_slugs: dto.make_slugs,
      model_slugs: dto.model_slugs,
      province_slug: dto.province_slug,
      municipality_slug: dto.municipality_slug,
      until_price: dto.until_price,
    };

    return this.hero_search_repository.getFacets(filter);
  }
}
