import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { Province } from "../entities/province";

export abstract class ProvincesRepository {
  abstract findOne(id: number): Promise<Province | null>;
  abstract find_all(
    filter: CatalogPaginationFilter,
  ): Promise<PaginatedResult<Province>>;
  abstract save(province: Province): Promise<void>;
}
