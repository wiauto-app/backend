import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { OpenSearchHeroSearchRepository } from "@/src/contexts/vehicles/search/clients/opensearch/opensearch-hero-search.repository";
import { VehicleHeroDocumentBuilder } from "../builders/vehicle-hero-document.builder";

@Injectable()
export class IndexVehicleSearchDocService {
  constructor(
    private readonly hero_search_repository: OpenSearchHeroSearchRepository,
    private readonly vehicle_hero_document_builder: VehicleHeroDocumentBuilder,
  ) {}

  async execute(vehicle_id: string): Promise<void> {
    const document =
      await this.vehicle_hero_document_builder.buildForVehicleId(vehicle_id);

    if (!document) {
      await this.hero_search_repository.deleteDocument(vehicle_id);
      return;
    }

    const is_indexable =
      document.status === "active" && document.deleted_at === null;

    if (!is_indexable) {
      await this.hero_search_repository.deleteDocument(vehicle_id);
      return;
    }

    await this.hero_search_repository.indexDocument(document);
  }
}
