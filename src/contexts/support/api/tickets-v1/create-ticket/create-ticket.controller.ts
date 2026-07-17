import { Body, Controller, Post, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { TicketsService } from "@/src/contexts/support/services/tickets.service";

import { V1_TICKETS } from "../../route.constants";
import { CreateTicketHttpDto } from "./create-ticket.http-dto";

@Controller(V1_TICKETS)
@UseGuards(JwtGuard)
export class CreateTicketController {
  constructor(private readonly tickets_service: TicketsService) {}

  @Post()
  run(@GetUserId() profile_id: string, @Body() body: CreateTicketHttpDto) {
    return this.tickets_service.create({
      profile_id,
      category_id: body.category_id,
      title: body.title,
      description: body.description,
      file_url: body.file_url,
    });
  }
}
