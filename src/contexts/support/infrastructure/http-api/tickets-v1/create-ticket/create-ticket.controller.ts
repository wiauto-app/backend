import { Body, Controller, Post, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { CreateTicketUseCase } from "@/src/contexts/support/application/ticket-use-cases/create-ticket-use-case/create-ticket.use-case";

import { V1_TICKETS } from "../../../route.constants";
import { CreateTicketHttpDto } from "./create-ticket.http-dto";

@Controller(V1_TICKETS)
@UseGuards(JwtGuard)
export class CreateTicketController {
  constructor(private readonly create_ticket_use_case: CreateTicketUseCase) {}

  @Post()
  run(@GetUserId() profile_id: string, @Body() body: CreateTicketHttpDto) {
    return this.create_ticket_use_case.execute({
      profile_id,
      category_id: body.category_id,
      title: body.title,
      description: body.description,
      file_url: body.file_url,
    });
  }
}
