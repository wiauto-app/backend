import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";

import { Ticket, TicketStatus } from "../types/ticket";
import { TicketCategoryNotFoundException } from "../exceptions/ticket-category-not-found.exception";
import { TicketForbiddenException } from "../exceptions/ticket-forbidden.exception";
import { TicketNotFoundException } from "../exceptions/ticket-not-found.exception";
import { TicketFilter } from "../types/ticket.filter";
import { TicketListItem } from "../types/ticket-list-item";
import { TypeOrmTicketRepository } from "../repositories/typeorm.ticket-repository";
import { TicketCategoriesService } from "./ticket-categories.service";

export interface CreateTicketInput {
  profile_id: string;
  category_id: string;
  title: string;
  description: string;
  file_url?: string | null;
}

export interface UpdateTicketInput {
  ticket_id: string;
  profile_id: string;
  category_id?: string;
  title?: string;
  description?: string;
  file_url?: string | null;
  status?: TicketStatus;
}

export interface FindTicketInput {
  ticket_id: string;
  profile_id: string;
}

export interface FindAllTicketsInput {
  profile_id: string;
  status?: TicketStatus;
  category_id?: string;
  page?: number;
  limit?: number;
  query?: string;
  order_by?: string;
  order_direction?: "ASC" | "DESC";
}

export interface DeleteTicketInput {
  ticket_id: string;
  profile_id: string;
}

@Injectable()
export class TicketsService {
  constructor(
    private readonly ticket_repository: TypeOrmTicketRepository,
    private readonly ticket_categories_service: TicketCategoriesService,
  ) {}

  async create(input: CreateTicketInput): Promise<TicketListItem> {
    const category = await this.ticket_categories_service.findById(
      input.category_id,
    );
    if (!category) {
      throw new TicketCategoryNotFoundException(input.category_id);
    }

    const ticket = Ticket.create({
      title: input.title,
      description: input.description,
      file_url: input.file_url,
      category,
      profile_id: input.profile_id,
    });
    await this.ticket_repository.save(ticket);

    const created = await this.ticket_repository.findOne(
      ticket.toPrimitives().id,
    );
    if (!created) {
      throw new Error("Ticket recién creado no encontrado");
    }
    return created;
  }

  async update(input: UpdateTicketInput): Promise<TicketListItem> {
    const existing = await this.ticket_repository.findOne(input.ticket_id);
    if (!existing) {
      throw new TicketNotFoundException(input.ticket_id);
    }
    if (existing.profile_id !== input.profile_id) {
      throw new TicketForbiddenException();
    }

    let category = existing.category;
    if (input.category_id && input.category_id !== existing.category.id) {
      const loaded = await this.ticket_categories_service.findById(
        input.category_id,
      );
      if (!loaded) {
        throw new TicketCategoryNotFoundException(input.category_id);
      }
      category = loaded;
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
      title: input.title,
      description: input.description,
      file_url: input.file_url,
      category,
      status: input.status,
    });
    await this.ticket_repository.update(updated);

    const result = await this.ticket_repository.findOne(input.ticket_id);
    if (!result) {
      throw new TicketNotFoundException(input.ticket_id);
    }
    return result;
  }

  async findOne(input: FindTicketInput): Promise<TicketListItem> {
    const ticket = await this.ticket_repository.findOne(input.ticket_id);
    if (!ticket) {
      throw new TicketNotFoundException(input.ticket_id);
    }
    if (ticket.profile_id !== input.profile_id) {
      throw new TicketForbiddenException();
    }
    return ticket;
  }

  async findAll(
    input: FindAllTicketsInput,
  ): Promise<PaginatedResult<TicketListItem>> {
    const filter = new TicketFilter({
      profile_id: input.profile_id,
      status: input.status,
      category_id: input.category_id,
      page: input.page,
      limit: input.limit,
      query: input.query,
      order_by: input.order_by,
      order_direction: input.order_direction,
    });
    return this.ticket_repository.find_all(filter);
  }

  async remove(input: DeleteTicketInput): Promise<void> {
    const existing = await this.ticket_repository.findOne(input.ticket_id);
    if (!existing) {
      throw new TicketNotFoundException(input.ticket_id);
    }
    if (existing.profile_id !== input.profile_id) {
      throw new TicketForbiddenException();
    }
    await this.ticket_repository.delete(input.ticket_id);
  }
}
