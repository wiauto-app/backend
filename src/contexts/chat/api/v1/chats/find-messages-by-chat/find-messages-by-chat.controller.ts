import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";
import { ChatService } from "@/src/contexts/chat/services/chat.service";
import { ChatMessageService } from "@/src/contexts/chat/services/chat-message.service";
import { ChatMessageReadModelService } from "@/src/contexts/chat/services/chat-message-read-model.service";
import { ChatAccessService } from "@/src/contexts/chat/services/chat-access.service";

import { V1_CHATS } from "../../../route.constants";

@Controller(V1_CHATS)
@UseGuards(JwtGuard)
export class FindMessagesByChatController {
  constructor(
    private readonly chat_service: ChatService,
    private readonly chat_message_service: ChatMessageService,
    private readonly chat_access_service: ChatAccessService,
    private readonly chat_message_read_model_service: ChatMessageReadModelService,
  ) {}

  @Get(":chat_id/messages")
  async run(
    @GetUserId() user_id: string,
    @Param("chat_id", new ParseUUIDPipe()) chat_id: string,
    @Query() query: PaginationHttpDto,
  ) {
    const chat = await this.chat_service.findOne({ id: chat_id });
    this.chat_access_service.assertChatParticipant(chat, user_id);
    const messages = await this.chat_message_service.findByChat({
      chat_id,
      page: query.page,
      limit: query.limit,
      order_direction: query.order_direction,
      query: query.query,
      order_by: query.order_by,
      search: query.search,
    });
    return this.chat_message_read_model_service.toList(messages);
  }
}
