import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import {
  PrimitiveTicketCategory,
  TicketCategory,
} from "../../../domain/entities/ticket-category";
import { TicketCategoryRepository } from "../../../domain/repositories/ticket-category.repository";
import { CreateTicketCategoryDto } from "./create-ticket-category.dto";

@Injectable()
export class CreateTicketCategoryUseCase {
  constructor(
    private readonly ticket_category_repository: TicketCategoryRepository,
  ) {}

  async execute(
    dto: CreateTicketCategoryDto,
  ): Promise<PrimitiveTicketCategory> {
    const ticket_category = TicketCategory.create({ name: dto.name });
    await this.ticket_category_repository.save(ticket_category);
    return ticket_category.toPrimitives();
  }
}
