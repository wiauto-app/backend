import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { DgtLabel } from "../entities/dgt-label";

export abstract class DgtLabelsRepository {
  abstract findOne(id: string): Promise<DgtLabel | null>;
  abstract find_all(filter: CatalogPaginationFilter): Promise<PaginatedResult<DgtLabel>>;
  abstract save(label: DgtLabel): Promise<void>;
  abstract persist_updated(label: DgtLabel): Promise<void>;
  abstract remove(id: string): Promise<void>;
}
