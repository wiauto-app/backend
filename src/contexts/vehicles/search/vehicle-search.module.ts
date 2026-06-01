import { Module } from "@nestjs/common";
import type { Client } from "@opensearch-project/opensearch";

import { BulkReindexHeroSearchUseCase } from "./application/bulk-reindex-hero-search.use-case";
import { GetHeroFacetsUseCase } from "./application/get-hero-facets.use-case";
import { IndexVehicleSearchDocUseCase } from "./application/index-vehicle-search-doc.use-case";
import { HeroSearchRepository } from "./domain/ports/hero-search.repository";
import { VehicleHeroDocumentBuilder } from "./infrastructure/builders/vehicle-hero-document.builder";
import { AdminReindexHeroSearchController } from "./infrastructure/http-api/v1/admin-reindex-hero-search/admin-reindex-hero-search.controller";
import { HeroFacetsController } from "./infrastructure/http-api/v1/hero-facets/hero-facets.controller";
import { VehicleSearchIndexer } from "./infrastructure/indexing/vehicle-search-indexer.service";
import {
  create_opensearch_client,
  OPENSEARCH_CLIENT,
} from "./infrastructure/opensearch/opensearch-client.factory";
import { HeroSearchIndexBootstrapService } from "./infrastructure/opensearch/hero-search-index-bootstrap.service";
import { OpenSearchHeroSearchRepository } from "./infrastructure/opensearch/opensearch-hero-search.repository";

@Module({
  controllers: [HeroFacetsController, AdminReindexHeroSearchController],
  providers: [
    {
      provide: OPENSEARCH_CLIENT,
      useFactory: (): Client => create_opensearch_client(),
    },
    OpenSearchHeroSearchRepository,
    {
      provide: HeroSearchRepository,
      useExisting: OpenSearchHeroSearchRepository,
    },
    VehicleHeroDocumentBuilder,
    VehicleSearchIndexer,
    GetHeroFacetsUseCase,
    IndexVehicleSearchDocUseCase,
    BulkReindexHeroSearchUseCase,
    HeroSearchIndexBootstrapService,
  ],
  exports: [VehicleSearchIndexer, BulkReindexHeroSearchUseCase],
})
export class VehicleSearchModule {}
