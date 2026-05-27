import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { PaginationHttpDto } from "@/src/contexts/shared/infrastructure/http-dtos/pagination.http-dto";
import { FindChatUseCase } from "@/src/contexts/chat/application/chat-use-cases/find-chat-use-case/find-chat.use-case";
import { FindMessagesByChatUseCase } from "@/src/contexts/chat/application/chat-message-use-cases/find-messages-by-chat-use-case/find-messages-by-chat.use-case";
import { ChatAccessService } from "@/src/contexts/chat/infrastructure/services/chat-access.service";

import { V1_CHATS } from "../../../route.constants";

@Controller(V1_CHATS)
@UseGuards(JwtGuard)
export class FindMessagesByChatController {
  constructor(
    private readonly find_chat_use_case: FindChatUseCase,
    private readonly find_messages_by_chat_use_case: FindMessagesByChatUseCase,
    private readonly chat_access_service: ChatAccessService,
  ) {}

  @Get(":chat_id/messages")
  async run(
    @GetUserId() user_id: string,
    @Param("chat_id", new ParseUUIDPipe()) chat_id: string,
    @Query() query: PaginationHttpDto,
  ) {
    const chat = await this.find_chat_use_case.execute({ id: chat_id });
    this.chat_access_service.assertChatParticipant(chat, user_id);
    return this.find_messages_by_chat_use_case.execute({
      chat_id,
      page: query.page,
      limit: query.limit,
      order_direction: query.order_direction,
      query: query.query,
      order_by: query.order_by,
      search: query.search,
    });
  }
}

