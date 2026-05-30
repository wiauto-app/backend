import { Controller, Get, Param } from "@nestjs/common";

import { FindTicketCategoryUseCase } from "@/src/contexts/support/application/ticket-category-use-cases/find-ticket-category-use-case/find-ticket-category.use-case";

import { V1_TICKET_CATEGORIES } from "../../../route.constants";
import { FindTicketCategoryHttpDto } from "./find-ticket-category.http-dto";

@Controller(V1_TICKET_CATEGORIES)
export class FindTicketCategoryController {
  constructor(
    private readonly find_ticket_category_use_case: FindTicketCategoryUseCase,
  ) {}

  @Get(":id")
  run(@Param() params: FindTicketCategoryHttpDto) {
    return this.find_ticket_category_use_case.execute(params);
  }
}
