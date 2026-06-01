import { Controller, Get, Query } from "@nestjs/common";

import { V1_SEARCH_HERO_FACETS } from "@/src/contexts/vehicles/infrastructure/http-api/route.constants";
import { GetHeroFacetsUseCase } from "../../../../application/get-hero-facets.use-case";
import { HeroFacetsHttpDto } from "./hero-facets.http-dto";

@Controller(V1_SEARCH_HERO_FACETS)
export class HeroFacetsController {
  constructor(private readonly get_hero_facets_use_case: GetHeroFacetsUseCase) {}

  @Get()
  getFacets(@Query() query: HeroFacetsHttpDto) {
    return this.get_hero_facets_use_case.execute(query);
  }
}
