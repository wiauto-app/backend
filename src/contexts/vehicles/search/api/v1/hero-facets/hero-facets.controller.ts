import { Controller, Get, Query } from "@nestjs/common";

import { V1_SEARCH_HERO_FACETS } from "@/src/contexts/vehicles/api/route.constants";
import { GetHeroFacetsService } from "../../../services/get-hero-facets.service";
import { HeroFacetsHttpDto } from "./hero-facets.http-dto";

@Controller(V1_SEARCH_HERO_FACETS)
export class HeroFacetsController {
  constructor(private readonly get_hero_facets_service: GetHeroFacetsService) {}

  @Get()
  getFacets(@Query() query: HeroFacetsHttpDto) {
    return this.get_hero_facets_service.execute(query);
  }
}
