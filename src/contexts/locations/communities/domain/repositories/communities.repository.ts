import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { Community } from "../entities/community";

export abstract class CommunitiesRepository {
  abstract findOne(id: number): Promise<Community | null>;
  abstract find_all(
    filter: CatalogPaginationFilter,
  ): Promise<PaginatedResult<Community>>;
  abstract save(community: Community): Promise<void>;
}
