import { Controller, Get, Param, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { FindTicketUseCase } from "@/src/contexts/support/application/ticket-use-cases/find-ticket-use-case/find-ticket.use-case";

import { V1_TICKETS } from "../../../route.constants";
import { FindTicketHttpDto } from "./find-ticket.http-dto";

@Controller(V1_TICKETS)
@UseGuards(JwtGuard)
export class FindTicketController {
  constructor(private readonly find_ticket_use_case: FindTicketUseCase) {}

  @Get(":id")
  run(@GetUserId() profile_id: string, @Param() params: FindTicketHttpDto) {
    const { id } = params;
    return this.find_ticket_use_case.execute({
      ticket_id: id,
      profile_id,
    });
  }
}
