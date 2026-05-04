import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { Traction } from "../entities/traction";

export abstract class TractionsRepository {
  abstract findOne(id: string): Promise<Traction | null>;
  abstract find_all(filter: CatalogPaginationFilter): Promise<PaginatedResult<Traction>>;
  abstract save(traction: Traction): Promise<void>;
  abstract persist_updated(traction: Traction): Promise<void>;
  abstract remove(id: string): Promise<void>;
}
