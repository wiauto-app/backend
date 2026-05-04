import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { Make } from "../entities/make";

export abstract class MakesRepository {
  abstract findOne(id: number): Promise<Make | null>;
  abstract find_all(filter: CatalogPaginationFilter): Promise<PaginatedResult<Make>>;
  abstract save(make: Make): Promise<Make>;
  abstract remove(id: number): Promise<void>;
}
