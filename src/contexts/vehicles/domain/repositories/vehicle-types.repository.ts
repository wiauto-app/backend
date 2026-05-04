import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { VehicleType } from "../entities/vehicle-types";

export abstract class VehicleTypesRepository {
  abstract findOne(id: string): Promise<VehicleType | null>;
  abstract find_all(filter: CatalogPaginationFilter): Promise<PaginatedResult<VehicleType>>;
  abstract save(vehicleType: VehicleType): Promise<void>;
  abstract update(id: string, name: string): Promise<void>;
  abstract remove(id: string): Promise<void>;
}
