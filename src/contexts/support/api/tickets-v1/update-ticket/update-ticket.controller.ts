import { Body, Controller, Param, Patch, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { TicketsService } from "@/src/contexts/support/services/tickets.service";

import { V1_TICKETS } from "../../route.constants";
import { FindTicketHttpDto } from "../find-ticket/find-ticket.http-dto";
import { UpdateTicketHttpDto } from "./update-ticket.http-dto";

@Controller(V1_TICKETS)
@UseGuards(JwtGuard)
export class UpdateTicketController {
  constructor(private readonly tickets_service: TicketsService) {}

  @Patch(":id")
  run(
    @GetUserId() profile_id: string,
    @Param() params: FindTicketHttpDto,
    @Body() body: UpdateTicketHttpDto,
  ) {
    return this.tickets_service.update({
      ticket_id: params.id,
      profile_id,
      category_id: body.category_id,
      title: body.title,
      description: body.description,
      file_url: body.file_url,
      status: body.status,
    });
  }
}
