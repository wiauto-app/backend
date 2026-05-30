import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { TicketForbiddenException } from "../../../domain/exceptions/ticket-forbidden.exception";
import { TicketNotFoundException } from "../../../domain/exceptions/ticket-not-found.exception";
import { TicketListItem } from "../../../domain/read-models/ticket-list-item";
import { TicketRepository } from "../../../domain/repositories/ticket.repository";
import { FindTicketDto } from "./find-ticket.dto";

@Injectable()
export class FindTicketUseCase {
  constructor(private readonly ticket_repository: TicketRepository) {}

  async execute(dto: FindTicketDto): Promise<TicketListItem> {
    const ticket = await this.ticket_repository.findOne(dto.ticket_id);
    if (!ticket) {
      throw new TicketNotFoundException(dto.ticket_id);
    }
    if (ticket.profile_id !== dto.profile_id) {
      throw new TicketForbiddenException();
    }
    return ticket;
  }
}
