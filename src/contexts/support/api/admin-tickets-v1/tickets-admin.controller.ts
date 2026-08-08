import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";

import { AuthAdmin } from "@/src/contexts/auth/decorators/auth-admin.decorator";
import { TicketsService } from "@/src/contexts/support/services/tickets.service";

import { V1_ADMIN_TICKETS } from "../route.constants";
import { FindAllTicketsHttpDto } from "../tickets-v1/find-all-tickets/find-all-tickets.http-dto";
import { UpdateTicketHttpDto } from "../tickets-v1/update-ticket/update-ticket.http-dto";

@AuthAdmin()
@Controller(V1_ADMIN_TICKETS)
export class TicketsAdminController {
  constructor(private readonly tickets_service: TicketsService) {}

  @Get()
  findAll(@Query() query: FindAllTicketsHttpDto) {
    return this.tickets_service.findAll({
      status: query.status,
      category_id: query.category_id,
      page: query.page,
      limit: query.limit,
      query: query.query,
      order_by: query.order_by,
      order_direction: query.order_direction,
    });
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.tickets_service.findOneAdmin(id);
  }

  @Patch(":id")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: UpdateTicketHttpDto,
  ) {
    return this.tickets_service.updateAsAdmin({
      ticket_id: id,
      category_id: body.category_id,
      title: body.title,
      description: body.description,
      file_url: body.file_url,
      status: body.status,
    });
  }

  @Post(":id/ensure-chat")
  ensureChat(@Param("id", ParseUUIDPipe) id: string) {
    return this.tickets_service.ensureSupportChat(id);
  }

  @Delete(":id")
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.tickets_service.removeAsAdmin(id);
  }
}
