import { Controller, Delete, Param } from "@nestjs/common";

import { TicketCategoriesService } from "@/src/contexts/support/services/ticket-categories.service";

import { V1_TICKET_CATEGORIES } from "../../route.constants";
import { DeleteTicketCategoryHttpDto } from "./delete-ticket-category.http-dto";

@Controller(V1_TICKET_CATEGORIES)
export class DeleteTicketCategoryController {
  constructor(
    private readonly ticket_categories_service: TicketCategoriesService,
  ) {}

  @Delete(":id")
  run(@Param() params: DeleteTicketCategoryHttpDto) {
    return this.ticket_categories_service.remove(params.id);
  }
}
