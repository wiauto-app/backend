import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { Ticket } from "../entities/ticket";
import { TicketFilter } from "../filters/ticket.filter";
import { TicketListItem } from "../read-models/ticket-list-item";

export abstract class TicketRepository {
  abstract findOne(id: string): Promise<TicketListItem | null>;
  abstract find_all(
    filter: TicketFilter,
  ): Promise<PaginatedResult<TicketListItem>>;
  abstract save(ticket: Ticket): Promise<Ticket>;
  abstract update(ticket: Ticket): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
