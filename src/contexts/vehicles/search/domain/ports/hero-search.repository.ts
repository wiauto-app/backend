import type { VehicleHeroSearchDocument } from "../entities/vehicle-hero-search-document";
import type { HeroSearchFacetFilter } from "../filters/hero-search-facet.filter";
import type { HeroFacetsResult } from "../read-models/hero-facet-item";

export abstract class HeroSearchRepository {
  abstract ensureIndex(): Promise<void>;

  abstract indexDocument(document: VehicleHeroSearchDocument): Promise<void>;

  abstract deleteDocument(vehicle_id: string): Promise<void>;

  abstract bulkIndexDocuments(
    documents: VehicleHeroSearchDocument[],
  ): Promise<{ indexed: number; errors: number }>;

  abstract getFacets(filter: HeroSearchFacetFilter): Promise<HeroFacetsResult>;
}
