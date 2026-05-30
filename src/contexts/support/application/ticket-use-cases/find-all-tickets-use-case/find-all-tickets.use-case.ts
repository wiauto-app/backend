import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { TicketFilter } from "../../../domain/filters/ticket.filter";
import { TicketListItem } from "../../../domain/read-models/ticket-list-item";
import { TicketRepository } from "../../../domain/repositories/ticket.repository";
import { FindAllTicketsDto } from "./find-all-tickets.dto";

@Injectable()
export class FindAllTicketsUseCase {
  constructor(private readonly ticket_repository: TicketRepository) {}

  async execute(dto: FindAllTicketsDto): Promise<PaginatedResult<TicketListItem>> {
    const filter = new TicketFilter({
      profile_id: dto.profile_id,
      status: dto.status,
      category_id: dto.category_id,
      page: dto.page,
      limit: dto.limit,
      query: dto.query,
      order_by: dto.order_by,
      order_direction: dto.order_direction,
    });
    return this.ticket_repository.find_all(filter);
  }
}
