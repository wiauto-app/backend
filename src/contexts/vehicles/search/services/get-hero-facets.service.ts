import { BadRequestException } from "@nestjs/common";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import type { HeroSearchFacetFilter } from "../types/hero-search-facet.filter";
import type { HeroFacetsResult } from "../types/hero-facet-item";
import { OpenSearchHeroSearchRepository } from "@/src/contexts/vehicles/search/clients/opensearch/opensearch-hero-search.repository";
import { GetHeroFacetsDto } from "../dto/get-hero-facets.dto";

@Injectable()
export class GetHeroFacetsService {
  constructor(private readonly hero_search_repository: OpenSearchHeroSearchRepository) {}

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
