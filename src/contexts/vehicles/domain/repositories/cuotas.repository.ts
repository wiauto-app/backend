import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { Cuota } from "../entities/cuota";

export abstract class CuotasRepository {
  abstract findOne(id: string): Promise<Cuota | null>;
  abstract find_all(filter: CatalogPaginationFilter): Promise<PaginatedResult<Cuota>>;
  abstract save(cuota: Cuota): Promise<void>;
  abstract remove(id: string): Promise<void>;
}
