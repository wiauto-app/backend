import { Body, Controller, Post } from "@nestjs/common";

import { CreateTicketCategoryUseCase } from "@/src/contexts/support/application/ticket-category-use-cases/create-ticket-category-use-case/create-ticket-category.use-case";

import { V1_TICKET_CATEGORIES } from "../../../route.constants";
import { CreateTicketCategoryHttpDto } from "./create-ticket-category.http-dto";

@Controller(V1_TICKET_CATEGORIES)
export class CreateTicketCategoryController {
  constructor(
    private readonly create_ticket_category_use_case: CreateTicketCategoryUseCase,
  ) {}

  @Post()
  run(@Body() body: CreateTicketCategoryHttpDto) {
    return this.create_ticket_category_use_case.execute(body);
  }
}
