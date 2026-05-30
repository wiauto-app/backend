import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { PaginationHttpDto } from "@/src/contexts/shared/infrastructure/http-dtos/pagination.http-dto";

import { PrimitiveTicketCategory } from "../../../domain/entities/ticket-category";
import { TicketCategoryRepository } from "../../../domain/repositories/ticket-category.repository";

@Injectable()
export class FindAllTicketCategoriesUseCase {
  constructor(
    private readonly ticket_category_repository: TicketCategoryRepository,
  ) {}

  async execute(
    query: PaginationHttpDto,
  ): Promise<PaginatedResult<PrimitiveTicketCategory>> {
    const filter = new CatalogPaginationFilter({ ...query });
    const page = await this.ticket_category_repository.find_all(filter);
    return page.map((ticket_category) => ticket_category.toPrimitives());
  }
}
