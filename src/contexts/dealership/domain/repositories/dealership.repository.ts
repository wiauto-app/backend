import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { Dealership } from "../entities/dealership";
import { DealershipsFilter } from "../filters/dealerships.filter";

export abstract class DealershipRepository {
  abstract save(dealership: Dealership): Promise<void>;
  abstract findOne(id: string): Promise<Dealership | null>;
  abstract findAll(filter: DealershipsFilter): Promise<PaginatedResult<Dealership>>;
  abstract update(dealership: Dealership): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
