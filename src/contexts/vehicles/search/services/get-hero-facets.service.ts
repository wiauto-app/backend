import { BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { MakeEntity } from "@/src/contexts/vehicles/catalog/makes/entities/make.entity";

import type { HeroSearchFacetFilter } from "../types/hero-search-facet.filter";
import type {
  HeroCatalogFacetItem,
  HeroFacetsResult,
} from "../types/hero-facet-item";
import { OpenSearchHeroSearchRepository } from "@/src/contexts/vehicles/search/clients/opensearch/opensearch-hero-search.repository";
import { GetHeroFacetsDto } from "../dto/get-hero-facets.dto";

@Injectable()
export class GetHeroFacetsService {
  constructor(
    private readonly hero_search_repository: OpenSearchHeroSearchRepository,
    @InjectRepository(MakeEntity)
    private readonly make_repository: Repository<MakeEntity>,
  ) {}

  async execute(dto: GetHeroFacetsDto): Promise<HeroFacetsResult> {
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

    const result = await this.hero_search_repository.getFacets(filter);

    if (result.facet !== "makes") {
      return result;
    }

    return this.enrichMakesWithImageUrl(result);
  }

  private async enrichMakesWithImageUrl(
    result: HeroFacetsResult,
  ): Promise<HeroFacetsResult> {
    const make_items = result.items.filter(
      (item): item is HeroCatalogFacetItem => "slug" in item,
    );

    if (make_items.length === 0) {
      return result;
    }

    const make_ids = make_items.map((item) => item.id);
    const rows = await this.make_repository.find({
      where: { id: In(make_ids) },
      select: ["id", "image_url"],
    });

    const image_url_by_id = new Map(
      rows.map((row) => [row.id, row.image_url ?? null] as const),
    );

    return {
      facet: result.facet,
      items: make_items.map((item) => ({
        ...item,
        image_url: image_url_by_id.get(item.id) ?? null,
      })),
    };
  }
}
