import { Controller, Delete, Param } from "@nestjs/common";

import { DeleteTicketCategoryUseCase } from "@/src/contexts/support/application/ticket-category-use-cases/delete-ticket-category-use-case/delete-ticket-category.use-case";

import { V1_TICKET_CATEGORIES } from "../../../route.constants";
import { DeleteTicketCategoryHttpDto } from "./delete-ticket-category.http-dto";

@Controller(V1_TICKET_CATEGORIES)
export class DeleteTicketCategoryController {
  constructor(
    private readonly delete_ticket_category_use_case: DeleteTicketCategoryUseCase,
  ) {}

  @Delete(":id")
  run(@Param() params: DeleteTicketCategoryHttpDto) {
    return this.delete_ticket_category_use_case.execute(params);
  }
}
