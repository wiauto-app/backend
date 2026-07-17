import { Controller, Get, Param } from "@nestjs/common";

import { TicketCategoriesService } from "@/src/contexts/support/services/ticket-categories.service";

import { V1_TICKET_CATEGORIES } from "../../route.constants";
import { FindTicketCategoryHttpDto } from "./find-ticket-category.http-dto";

@Controller(V1_TICKET_CATEGORIES)
export class FindTicketCategoryController {
  constructor(
    private readonly ticket_categories_service: TicketCategoriesService,
  ) {}

  @Get(":id")
  run(@Param() params: FindTicketCategoryHttpDto) {
    return this.ticket_categories_service.findOne(params.id);
  }
}
