import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { WarrantyType } from "../entities/warranty-type";

export abstract class WarrantyTypesRepository {
  abstract findOne(id: string): Promise<WarrantyType | null>;
  abstract find_all(filter: CatalogPaginationFilter): Promise<PaginatedResult<WarrantyType>>;
  abstract save(warranty_type: WarrantyType): Promise<void>;
  abstract persist_updated(warranty_type: WarrantyType): Promise<void>;
  abstract remove(id: string): Promise<void>;
}
