import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { PrimitiveTicketCategory } from "../../../domain/entities/ticket-category";
import { TicketCategoryNotFoundException } from "../../../domain/exceptions/ticket-category-not-found.exception";
import { TicketCategoryRepository } from "../../../domain/repositories/ticket-category.repository";
import { FindTicketCategoryDto } from "./find-ticket-category.dto";

@Injectable()
export class FindTicketCategoryUseCase {
  constructor(
    private readonly ticket_category_repository: TicketCategoryRepository,
  ) {}

  async execute(dto: FindTicketCategoryDto): Promise<PrimitiveTicketCategory> {
    const ticket_category = await this.ticket_category_repository.findOne(
      dto.id,
    );
    if (!ticket_category) {
      throw new TicketCategoryNotFoundException(dto.id);
    }
    return ticket_category.toPrimitives();
  }
}
