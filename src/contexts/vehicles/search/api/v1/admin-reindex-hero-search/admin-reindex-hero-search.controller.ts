import { Controller, Post, UseGuards } from "@nestjs/common";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { AdminGuard } from "@/src/contexts/auth/guards/admin.guard";

import { V1_ADMIN_SEARCH_REINDEX_HERO } from "@/src/contexts/vehicles/api/route.constants";
import { BulkReindexHeroSearchService } from "../../../services/bulk-reindex-hero-search.service";

@Controller(V1_ADMIN_SEARCH_REINDEX_HERO)
// @UseGuards(JwtGuard, AdminGuard)
export class AdminReindexHeroSearchController {
  constructor(
    private readonly bulk_reindex_hero_search_service: BulkReindexHeroSearchService,
  ) {}

  @Post()
  run() {
    return this.bulk_reindex_hero_search_service.execute();
  }
}
