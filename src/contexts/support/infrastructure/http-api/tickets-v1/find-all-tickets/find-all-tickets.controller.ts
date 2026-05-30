import { Controller, Get, Query, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { FindAllTicketsUseCase } from "@/src/contexts/support/application/ticket-use-cases/find-all-tickets-use-case/find-all-tickets.use-case";

import { V1_TICKETS } from "../../../route.constants";
import { FindAllTicketsHttpDto } from "./find-all-tickets.http-dto";

@Controller(V1_TICKETS)
@UseGuards(JwtGuard)
export class FindAllTicketsController {
  constructor(private readonly find_all_tickets_use_case: FindAllTicketsUseCase) {}

  @Get()
  run(@GetUserId() profile_id: string, @Query() query: FindAllTicketsHttpDto) {
    return this.find_all_tickets_use_case.execute({
      profile_id,
      status: query.status,
      category_id: query.category_id,
      page: query.page,
      limit: query.limit,
      query: query.query,
      order_by: query.order_by,
      order_direction: query.order_direction,
    });
  }
}
