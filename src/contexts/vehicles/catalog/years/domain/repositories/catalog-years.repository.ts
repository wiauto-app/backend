import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { CatalogYear } from "../entities/catalog-year";

export abstract class CatalogYearsRepository {
  abstract findOne(id: number): Promise<CatalogYear | null>;
  abstract find_all(filter: CatalogPaginationFilter): Promise<PaginatedResult<CatalogYear>>;
  abstract save(year: CatalogYear): Promise<CatalogYear>;
  abstract remove(id: number): Promise<void>;
}
