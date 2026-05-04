import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { CatalogModel } from "../entities/catalog-model";

export abstract class CatalogModelsRepository {
  abstract findOne(id: number): Promise<CatalogModel | null>;
  abstract find_all(filter: CatalogPaginationFilter): Promise<PaginatedResult<CatalogModel>>;
  abstract save(row: CatalogModel): Promise<CatalogModel>;
  abstract remove(id: number): Promise<void>;
}
