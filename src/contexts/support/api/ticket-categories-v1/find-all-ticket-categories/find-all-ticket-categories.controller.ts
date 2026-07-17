import { Controller, Get, Query } from "@nestjs/common";
import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";

import { TicketCategoriesService } from "@/src/contexts/support/services/ticket-categories.service";

import { V1_TICKET_CATEGORIES } from "../../route.constants";

@Controller(V1_TICKET_CATEGORIES)
export class FindAllTicketCategoriesController {
  constructor(
    private readonly ticket_categories_service: TicketCategoriesService,
  ) {}

  @Get()
  run(@Query() query: PaginationHttpDto) {
    return this.ticket_categories_service.findAll(query);
  }
}
