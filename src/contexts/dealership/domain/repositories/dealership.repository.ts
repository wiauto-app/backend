import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { Dealership } from "../entities/dealership";
import { DealershipsFilter } from "../filters/dealerships.filter";
import { DealershipAdminList } from "../read-models/dealership-admin-list";

export abstract class DealershipRepository {
  abstract save(dealership: Dealership): Promise<void>;
  abstract findOne(id: string): Promise<Dealership | null>;
  abstract findAll(
    filter: DealershipsFilter,
  ): Promise<PaginatedResult<DealershipAdminList>>;
  abstract update(dealership: Dealership): Promise<void>;
  abstract updateRating(dealership_id: string, rating: number | null): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
