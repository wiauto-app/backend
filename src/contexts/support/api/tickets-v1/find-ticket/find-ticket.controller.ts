import { Controller, Get, Param, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { TicketsService } from "@/src/contexts/support/services/tickets.service";

import { V1_TICKETS } from "../../route.constants";
import { FindTicketHttpDto } from "./find-ticket.http-dto";

@Controller(V1_TICKETS)
@UseGuards(JwtGuard)
export class FindTicketController {
  constructor(private readonly tickets_service: TicketsService) {}

  @Get(":id")
  run(@GetUserId() profile_id: string, @Param() params: FindTicketHttpDto) {
    return this.tickets_service.findOne({
      ticket_id: params.id,
      profile_id,
    });
  }
}
