import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { PrimitiveTicketCategory } from "../../../domain/entities/ticket-category";
import { TicketCategoryNotFoundException } from "../../../domain/exceptions/ticket-category-not-found.exception";
import { TicketCategoryRepository } from "../../../domain/repositories/ticket-category.repository";
import { UpdateTicketCategoryDto } from "./update-ticket-category.dto";

@Injectable()
export class UpdateTicketCategoryUseCase {
  constructor(
    private readonly ticket_category_repository: TicketCategoryRepository,
  ) {}

  async execute(
    dto: UpdateTicketCategoryDto,
  ): Promise<PrimitiveTicketCategory> {
    const ticket_category = await this.ticket_category_repository.findOne(
      dto.id,
    );
    if (!ticket_category) {
      throw new TicketCategoryNotFoundException(dto.id);
    }
    const updated = ticket_category.update({ name: dto.name });
    await this.ticket_category_repository.update(updated);
    return updated.toPrimitives();
  }
}
