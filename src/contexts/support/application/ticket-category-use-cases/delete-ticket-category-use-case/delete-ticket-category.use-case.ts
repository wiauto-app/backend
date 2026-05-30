import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { TicketCategoryRepository } from "../../../domain/repositories/ticket-category.repository";
import { DeleteTicketCategoryDto } from "./delete-ticket-category.dto";

@Injectable()
export class DeleteTicketCategoryUseCase {
  constructor(
    private readonly ticket_category_repository: TicketCategoryRepository,
  ) {}

  async execute(dto: DeleteTicketCategoryDto): Promise<void> {
    await this.ticket_category_repository.delete(dto.id);
  }
}
