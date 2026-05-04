import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { CatalogBodyType } from "../entities/catalog-body-type";

export abstract class CatalogBodyTypesRepository {
  abstract findOne(id: number): Promise<CatalogBodyType | null>;
  abstract find_all(filter: CatalogPaginationFilter): Promise<PaginatedResult<CatalogBodyType>>;
  abstract save(row: CatalogBodyType): Promise<CatalogBodyType>;
  abstract remove(id: number): Promise<void>;
}
