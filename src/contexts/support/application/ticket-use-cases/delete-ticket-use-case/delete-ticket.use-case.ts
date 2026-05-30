import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { TicketForbiddenException } from "../../../domain/exceptions/ticket-forbidden.exception";
import { TicketNotFoundException } from "../../../domain/exceptions/ticket-not-found.exception";
import { TicketRepository } from "../../../domain/repositories/ticket.repository";
import { DeleteTicketDto } from "./delete-ticket.dto";

@Injectable()
export class DeleteTicketUseCase {
  constructor(private readonly ticket_repository: TicketRepository) {}

  async execute(dto: DeleteTicketDto): Promise<void> {
    const existing = await this.ticket_repository.findOne(dto.ticket_id);
    if (!existing) {
      throw new TicketNotFoundException(dto.ticket_id);
    }
    if (existing.profile_id !== dto.profile_id) {
      throw new TicketForbiddenException();
    }
    await this.ticket_repository.delete(dto.ticket_id);
  }
}
