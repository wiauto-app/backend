import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";

import { envs } from "@/src/common/envs";
import { GetOptionalUserId } from "@/src/contexts/auth/decorators/GetOptionalUserId.decorator";
import { OptionalJwtGuard } from "@/src/contexts/auth/guards/optional-jwt.guard";
import { TicketsService } from "@/src/contexts/support/services/tickets.service";

import { V1_TICKETS } from "../../route.constants";
import { CreateTicketHttpDto } from "./create-ticket.http-dto";

@Controller(V1_TICKETS)
@UseGuards(OptionalJwtGuard, ThrottlerGuard)
@Throttle({
  "support-tickets": {
    limit: envs.SUPPORT_TICKETS_THROTTLE_LIMIT,
    ttl: envs.SUPPORT_TICKETS_THROTTLE_TTL_MS,
  },
})
export class CreateTicketController {
  constructor(private readonly tickets_service: TicketsService) {}

  @Post()
  run(
    @GetOptionalUserId() profile_id: string | undefined,
    @Body() body: CreateTicketHttpDto,
  ) {
    return this.tickets_service.create({
      profile_id: profile_id ?? null,
      category_id: body.category_id,
      title: body.title,
      description: body.description,
      file_url: body.file_url,
      guest_name: body.guest_name,
      guest_email: body.guest_email,
    });
  }
}
