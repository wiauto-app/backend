import { Controller, Delete, Param, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { DeleteTicketUseCase } from "@/src/contexts/support/application/ticket-use-cases/delete-ticket-use-case/delete-ticket.use-case";

import { V1_TICKETS } from "../../../route.constants";
import { FindTicketHttpDto } from "../find-ticket/find-ticket.http-dto";

@Controller(V1_TICKETS)
@UseGuards(JwtGuard)
export class DeleteTicketController {
  constructor(private readonly delete_ticket_use_case: DeleteTicketUseCase) {}

  @Delete(":id")
  run(@GetUserId() profile_id: string, @Param() params: FindTicketHttpDto) {
    const { id } = params;
    return this.delete_ticket_use_case.execute({
      ticket_id: id,
      profile_id,
    });
  }
}
