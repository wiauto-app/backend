import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { CatalogFuelType } from "../entities/catalog-fuel-type";

export abstract class CatalogFuelTypesRepository {
  abstract findOne(id: number): Promise<CatalogFuelType | null>;
  abstract find_all(filter: CatalogPaginationFilter): Promise<PaginatedResult<CatalogFuelType>>;
  abstract save(row: CatalogFuelType): Promise<CatalogFuelType>;
  abstract remove(id: number): Promise<void>;
}
