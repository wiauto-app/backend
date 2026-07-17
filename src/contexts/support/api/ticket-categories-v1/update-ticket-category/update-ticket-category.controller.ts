import { Body, Controller, Patch } from "@nestjs/common";

import { TicketCategoriesService } from "@/src/contexts/support/services/ticket-categories.service";

import { V1_TICKET_CATEGORIES } from "../../route.constants";
import { UpdateTicketCategoryHttpDto } from "./update-ticket-category.http-dto";

@Controller(V1_TICKET_CATEGORIES)
export class UpdateTicketCategoryController {
  constructor(
    private readonly ticket_categories_service: TicketCategoriesService,
  ) {}

  @Patch()
  run(@Body() body: UpdateTicketCategoryHttpDto) {
    return this.ticket_categories_service.update(body.id, { name: body.name });
  }
}
