import { Controller, Get, Query } from "@nestjs/common";

import { V1_SEARCH_HERO_COUNT } from "@/src/contexts/vehicles/api/route.constants";
import { GetHeroCountService } from "../../../services/get-hero-count.service";
import { HeroCountHttpDto } from "./hero-count.http-dto";

@Controller(V1_SEARCH_HERO_COUNT)
export class HeroCountController {
  constructor(private readonly get_hero_count_service: GetHeroCountService) {}

  @Get()
  getCount(@Query() query: HeroCountHttpDto) {
    return this.get_hero_count_service.execute(query);
  }
}
