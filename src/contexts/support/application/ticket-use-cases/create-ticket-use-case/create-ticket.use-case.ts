import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { Ticket } from "../../../domain/entities/ticket";
import { TicketCategoryNotFoundException } from "../../../domain/exceptions/ticket-category-not-found.exception";
import { TicketListItem } from "../../../domain/read-models/ticket-list-item";
import { TicketCategoryRepository } from "../../../domain/repositories/ticket-category.repository";
import { TicketRepository } from "../../../domain/repositories/ticket.repository";
import { CreateTicketDto } from "./create-ticket.dto";

@Injectable()
export class CreateTicketUseCase {
  constructor(
    private readonly ticket_repository: TicketRepository,
    private readonly ticket_category_repository: TicketCategoryRepository,
  ) {}

  async execute(dto: CreateTicketDto): Promise<TicketListItem> {
    const category = await this.ticket_category_repository.findOne(
      dto.category_id,
    );
    if (!category) {
      throw new TicketCategoryNotFoundException(dto.category_id);
    }

    const ticket = Ticket.create({
      title: dto.title,
      description: dto.description,
      file_url: dto.file_url,
      category: category.toPrimitives(),
      profile_id: dto.profile_id,
    });
    await this.ticket_repository.save(ticket);

    const created = await this.ticket_repository.findOne(ticket.toPrimitives().id);
    if (!created) {
      throw new Error("Ticket recién creado no encontrado");
    }
    return created;
  }
}
