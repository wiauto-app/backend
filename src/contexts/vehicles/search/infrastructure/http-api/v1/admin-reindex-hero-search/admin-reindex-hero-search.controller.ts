import { Controller, Post } from "@nestjs/common";

import { V1_ADMIN_SEARCH_REINDEX_HERO } from "@/src/contexts/vehicles/infrastructure/http-api/route.constants";
import { BulkReindexHeroSearchUseCase } from "../../../../application/bulk-reindex-hero-search.use-case";

@Controller(V1_ADMIN_SEARCH_REINDEX_HERO)
export class AdminReindexHeroSearchController {
  constructor(
    private readonly bulk_reindex_hero_search_use_case: BulkReindexHeroSearchUseCase,
  ) {}

  @Post()
  run() {
    return this.bulk_reindex_hero_search_use_case.execute();
  }
}
