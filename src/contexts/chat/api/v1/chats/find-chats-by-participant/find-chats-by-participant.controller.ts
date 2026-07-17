import { Controller, Get, Query, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";
import { ChatService } from "@/src/contexts/chat/services/chat.service";

import { V1_CHATS } from "../../../route.constants";

@Controller(V1_CHATS)
@UseGuards(JwtGuard)
export class FindChatsByParticipantController {
  constructor(private readonly chat_service: ChatService) {}

  @Get()
  run(@GetUserId() participant_id: string, @Query() query: PaginationHttpDto) {
    return this.chat_service.findByParticipant({
      participants_ids: [participant_id],
      requesting_user_id: participant_id,
      page: query.page,
      limit: query.limit,
      order_direction: query.order_direction,
      query: query.query,
      order_by: query.order_by,
      search: query.search,
    });
  }
}
