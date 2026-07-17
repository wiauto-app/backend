import { Module } from "@nestjs/common";
import type { Client } from "@opensearch-project/opensearch";

import { BulkReindexHeroSearchService } from "./services/bulk-reindex-hero-search.service";
import { GetHeroFacetsService } from "./services/get-hero-facets.service";
import { IndexVehicleSearchDocService } from "./services/index-vehicle-search-doc.service";
import { VehicleHeroDocumentBuilder } from "./builders/vehicle-hero-document.builder";
import { AdminReindexHeroSearchController } from "./api/v1/admin-reindex-hero-search/admin-reindex-hero-search.controller";
import { HeroFacetsController } from "./api/v1/hero-facets/hero-facets.controller";
import { VehicleSearchIndexer } from "./indexing/vehicle-search-indexer.service";
import {
  create_opensearch_client,
  OPENSEARCH_CLIENT,
} from "./clients/opensearch/opensearch-client.factory";
import { HeroSearchIndexBootstrapService } from "./clients/opensearch/hero-search-index-bootstrap.service";
import { OpenSearchHeroSearchRepository } from "./clients/opensearch/opensearch-hero-search.repository";

@Module({
  controllers: [HeroFacetsController, AdminReindexHeroSearchController],
  providers: [
    {
      provide: OPENSEARCH_CLIENT,
      useFactory: (): Client => create_opensearch_client(),
    },
    OpenSearchHeroSearchRepository,
    VehicleHeroDocumentBuilder,
    VehicleSearchIndexer,
    GetHeroFacetsService,
    IndexVehicleSearchDocService,
    BulkReindexHeroSearchService,
    HeroSearchIndexBootstrapService,
  ],
  exports: [VehicleSearchIndexer, BulkReindexHeroSearchService],
})
export class VehicleSearchModule {}
