import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import type { HeroSearchBaseFilter } from "../types/hero-search-facet.filter";
import { OpenSearchHeroSearchRepository } from "@/src/contexts/vehicles/search/clients/opensearch/opensearch-hero-search.repository";
import type { GetHeroCountDto } from "../dto/get-hero-count.dto";

export interface HeroCountResult {
  count: number;
}

@Injectable()
export class GetHeroCountService {
  constructor(
    private readonly hero_search_repository: OpenSearchHeroSearchRepository,
  ) {}

  async execute(dto: GetHeroCountDto): Promise<HeroCountResult> {
    const filter: HeroSearchBaseFilter = {
      make_slugs: dto.make_slugs,
      model_slugs: dto.model_slugs,
      province_slug: dto.province_slug,
      municipality_slug: dto.municipality_slug,
      until_price: dto.until_price,
    };

    return this.hero_search_repository.countDocuments(filter);
  }
}
