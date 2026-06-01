import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { HeroSearchRepository } from "../domain/ports/hero-search.repository";
import { VehicleHeroDocumentBuilder } from "../infrastructure/builders/vehicle-hero-document.builder";

@Injectable()
export class IndexVehicleSearchDocUseCase {
  constructor(
    private readonly hero_search_repository: HeroSearchRepository,
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
