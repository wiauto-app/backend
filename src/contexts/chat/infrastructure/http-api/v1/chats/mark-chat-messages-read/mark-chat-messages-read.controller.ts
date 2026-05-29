import { Body, Controller, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { FindChatUseCase } from "@/src/contexts/chat/application/chat-use-cases/find-chat-use-case/find-chat.use-case";
import { MarkChatMessagesReadUseCase } from "@/src/contexts/chat/application/chat-message-use-cases/mark-chat-messages-read-use-case/mark-chat-messages-read.use-case";
import { ChatAccessService } from "@/src/contexts/chat/infrastructure/services/chat-access.service";
import { ChatMessageGateway } from "@/src/contexts/chat/infrastructure/gateways/chat-message.gateway";

import { V1_CHATS } from "../../../route.constants";
import { MarkChatMessagesReadHttpDto } from "./mark-chat-messages-read.http-dto";

@Controller(V1_CHATS)
@UseGuards(JwtGuard)
export class MarkChatMessagesReadController {
  constructor(
    private readonly find_chat_use_case: FindChatUseCase,
    private readonly mark_chat_messages_read_use_case: MarkChatMessagesReadUseCase,
    private readonly chat_access_service: ChatAccessService,
    private readonly chat_message_gateway: ChatMessageGateway,
  ) {}

  @Post(":chat_id/read")
  async run(
    @GetUserId() user_id: string,
    @Param("chat_id", new ParseUUIDPipe()) chat_id: string,
    @Body() body: MarkChatMessagesReadHttpDto,
  ) {
    const chat = await this.find_chat_use_case.execute({ id: chat_id });
    this.chat_access_service.assertChatParticipant(chat, user_id);

    const result = await this.mark_chat_messages_read_use_case.execute({
      chat_id,
      user_id,
      last_message_id: body.last_message_id,
    });

    this.chat_message_gateway.emitMessagesRead({
      chat_id,
      reader_id: user_id,
      message_ids: result.updated_messages.map((message) => message.id),
    });
    this.chat_message_gateway.emitUnreadUpdated({
      chat_id,
      user_id,
      unread_count: result.unread_count,
    });

    return result;
  }
}
