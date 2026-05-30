import { Controller, Get, Query } from "@nestjs/common";
import { PaginationHttpDto } from "@/src/contexts/shared/infrastructure/http-dtos/pagination.http-dto";

import { FindAllTicketCategoriesUseCase } from "@/src/contexts/support/application/ticket-category-use-cases/find-all-ticket-categories-use-case/find-all-ticket-categories.use-case";

import { V1_TICKET_CATEGORIES } from "../../../route.constants";

@Controller(V1_TICKET_CATEGORIES)
export class FindAllTicketCategoriesController {
  constructor(
    private readonly find_all_ticket_categories_use_case: FindAllTicketCategoriesUseCase,
  ) {}

  @Get()
  run(@Query() query: PaginationHttpDto) {
    return this.find_all_ticket_categories_use_case.execute(query);
  }
}
