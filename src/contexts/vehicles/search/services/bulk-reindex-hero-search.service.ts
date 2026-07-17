import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { OpenSearchHeroSearchRepository } from "@/src/contexts/vehicles/search/clients/opensearch/opensearch-hero-search.repository";
import { VehicleHeroDocumentBuilder } from "../builders/vehicle-hero-document.builder";

@Injectable()
export class BulkReindexHeroSearchService {
  constructor(
    private readonly hero_search_repository: OpenSearchHeroSearchRepository,
    private readonly vehicle_hero_document_builder: VehicleHeroDocumentBuilder,
  ) {}

  async execute(): Promise<{ indexed: number; errors: number; total: number }> {
    await this.hero_search_repository.ensureIndex();

    const documents = await this.vehicle_hero_document_builder.buildAllIndexable();
    const result = await this.hero_search_repository.bulkIndexDocuments(documents);

    return {
      ...result,
      total: documents.length,
    };
  }
}
