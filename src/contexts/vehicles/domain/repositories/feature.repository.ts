import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { Feature } from "../entities/features";

export abstract class FeatureRepository {
  abstract findOne(id: string): Promise<Feature | null>;
  abstract find_all(filter: CatalogPaginationFilter): Promise<PaginatedResult<Feature>>;
  abstract save(feature: Feature): Promise<void>;
  abstract persist_updated(feature: Feature): Promise<void>;
  abstract remove(id: string): Promise<void>;
}
