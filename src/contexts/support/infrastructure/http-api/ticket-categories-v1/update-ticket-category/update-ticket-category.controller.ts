import { Body, Controller, Patch } from "@nestjs/common";

import { UpdateTicketCategoryUseCase } from "@/src/contexts/support/application/ticket-category-use-cases/update-ticket-category-use-case/update-ticket-category.use-case";

import { V1_TICKET_CATEGORIES } from "../../../route.constants";
import { UpdateTicketCategoryHttpDto } from "./update-ticket-category.http-dto";

@Controller(V1_TICKET_CATEGORIES)
export class UpdateTicketCategoryController {
  constructor(
    private readonly update_ticket_category_use_case: UpdateTicketCategoryUseCase,
  ) {}

  @Patch()
  run(@Body() body: UpdateTicketCategoryHttpDto) {
    return this.update_ticket_category_use_case.execute(body);
  }
}
