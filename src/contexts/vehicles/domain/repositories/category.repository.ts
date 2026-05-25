import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { Category } from "../entities/category";

export abstract class CategoryRepository {
  abstract findOne(id: string): Promise<Category | null>;
  abstract find_all(
    filter: CatalogPaginationFilter,
  ): Promise<PaginatedResult<Category>>;
  abstract save(category: Category): Promise<Category>;
  abstract update(category: Category): Promise<void>;
  abstract delete(id: string): Promise<void>;
}