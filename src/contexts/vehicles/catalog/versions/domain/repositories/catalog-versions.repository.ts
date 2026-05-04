import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { CatalogVersion } from "../entities/catalog-version";

export abstract class CatalogVersionsRepository {
  abstract findOne(id: number): Promise<CatalogVersion | null>;
  abstract find_all(filter: CatalogPaginationFilter): Promise<PaginatedResult<CatalogVersion>>;
  abstract save(row: CatalogVersion): Promise<CatalogVersion>;
  abstract remove(id: number): Promise<void>;
}
