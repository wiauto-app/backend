import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { Ticket } from "../../../domain/entities/ticket";
import { TicketCategoryNotFoundException } from "../../../domain/exceptions/ticket-category-not-found.exception";
import { TicketForbiddenException } from "../../../domain/exceptions/ticket-forbidden.exception";
import { TicketNotFoundException } from "../../../domain/exceptions/ticket-not-found.exception";
import { TicketListItem } from "../../../domain/read-models/ticket-list-item";
import { TicketCategoryRepository } from "../../../domain/repositories/ticket-category.repository";
import { TicketRepository } from "../../../domain/repositories/ticket.repository";
import { UpdateTicketDto } from "./update-ticket.dto";

@Injectable()
export class UpdateTicketUseCase {
  constructor(
    private readonly ticket_repository: TicketRepository,
    private readonly ticket_category_repository: TicketCategoryRepository,
  ) {}

  async execute(dto: UpdateTicketDto): Promise<TicketListItem> {
    const existing = await this.ticket_repository.findOne(dto.ticket_id);
    if (!existing) {
      throw new TicketNotFoundException(dto.ticket_id);
    }
    if (existing.profile_id !== dto.profile_id) {
      throw new TicketForbiddenException();
    }

    let category = existing.category;
    if (dto.category_id && dto.category_id !== existing.category.id) {
      const loaded = await this.ticket_category_repository.findOne(
        dto.category_id,
      );
      if (!loaded) {
        throw new TicketCategoryNotFoundException(dto.category_id);
      }
      category = loaded.toPrimitives();
    }

    const ticket = Ticket.fromPrimitives({
      id: existing.id,
      title: existing.title,
      description: existing.description,
      file_url: existing.file_url,
      status: existing.status,
      profile_id: existing.profile_id,
      created_at: existing.created_at,
      updated_at: existing.updated_at,
      category,
    });

    const updated = ticket.update({
      title: dto.title,
      description: dto.description,
      file_url: dto.file_url,
      category,
      status: dto.status,
    });
    await this.ticket_repository.update(updated);

    const result = await this.ticket_repository.findOne(dto.ticket_id);
    if (!result) {
      throw new TicketNotFoundException(dto.ticket_id);
    }
    return result;
  }
}
