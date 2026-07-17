import { Controller, Get, Query, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { TicketsService } from "@/src/contexts/support/services/tickets.service";

import { V1_TICKETS } from "../../route.constants";
import { FindAllTicketsHttpDto } from "./find-all-tickets.http-dto";

@Controller(V1_TICKETS)
@UseGuards(JwtGuard)
export class FindAllTicketsController {
  constructor(private readonly tickets_service: TicketsService) {}

  @Get()
  run(@GetUserId() profile_id: string, @Query() query: FindAllTicketsHttpDto) {
    return this.tickets_service.findAll({
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
