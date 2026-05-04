import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { Service } from "../entities/services";

export abstract class ServicesRepository {
  abstract findOne(id: string): Promise<Service | null>;
  abstract find_all(filter: CatalogPaginationFilter): Promise<PaginatedResult<Service>>;
  abstract save(service: Service): Promise<void>;
  abstract persist_updated(service: Service): Promise<void>;
  abstract remove(id: string): Promise<void>;
}
