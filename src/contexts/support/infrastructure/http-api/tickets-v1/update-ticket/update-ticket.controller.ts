import { Body, Controller, Param, Patch, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { UpdateTicketUseCase } from "@/src/contexts/support/application/ticket-use-cases/update-ticket-use-case/update-ticket.use-case";

import { V1_TICKETS } from "../../../route.constants";
import { FindTicketHttpDto } from "../find-ticket/find-ticket.http-dto";
import { UpdateTicketHttpDto } from "./update-ticket.http-dto";

@Controller(V1_TICKETS)
@UseGuards(JwtGuard)
export class UpdateTicketController {
  constructor(private readonly update_ticket_use_case: UpdateTicketUseCase) {}

  @Patch(":id")
  run(
    @GetUserId() profile_id: string,
    @Param() params: FindTicketHttpDto,
    @Body() body: UpdateTicketHttpDto,
  ) {
    const { id } = params;
    return this.update_ticket_use_case.execute({
      ticket_id: id,
      profile_id,
      category_id: body.category_id,
      title: body.title,
      description: body.description,
      file_url: body.file_url,
      status: body.status,
    });
  }
}
