import { Body, Controller, Post } from "@nestjs/common";

import { TicketCategoriesService } from "@/src/contexts/support/services/ticket-categories.service";

import { V1_TICKET_CATEGORIES } from "../../route.constants";
import { CreateTicketCategoryHttpDto } from "./create-ticket-category.http-dto";

@Controller(V1_TICKET_CATEGORIES)
export class CreateTicketCategoryController {
  constructor(
    private readonly ticket_categories_service: TicketCategoriesService,
  ) {}

  @Post()
  run(@Body() body: CreateTicketCategoryHttpDto) {
    return this.ticket_categories_service.create(body);
  }
}
