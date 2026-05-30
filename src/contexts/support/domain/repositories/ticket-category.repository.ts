import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { TicketCategory } from "../entities/ticket-category";

export abstract class TicketCategoryRepository {
  abstract findOne(id: string): Promise<TicketCategory | null>;
  abstract find_all(
    filter: CatalogPaginationFilter,
  ): Promise<PaginatedResult<TicketCategory>>;
  abstract save(ticket_category: TicketCategory): Promise<TicketCategory>;
  abstract update(ticket_category: TicketCategory): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
