import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { Municipality } from "../entities/municipality";

export abstract class MunicipalitiesRepository {
  abstract findOne(id: number): Promise<Municipality | null>;
  abstract find_all(
    filter: CatalogPaginationFilter,
  ): Promise<PaginatedResult<Municipality>>;
  abstract save(municipality: Municipality): Promise<void>;
}
