import { Body, Controller, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { ChatService } from "@/src/contexts/chat/services/chat.service";
import { ChatMessageService } from "@/src/contexts/chat/services/chat-message.service";
import { ChatAccessService } from "@/src/contexts/chat/services/chat-access.service";
import { ChatMessageGateway } from "@/src/contexts/chat/gateways/chat-message.gateway";

import { V1_CHATS } from "../../../route.constants";
import { MarkChatMessagesReadHttpDto } from "./mark-chat-messages-read.http-dto";

@Controller(V1_CHATS)
@UseGuards(JwtGuard)
export class MarkChatMessagesReadController {
  constructor(
    private readonly chat_service: ChatService,
    private readonly chat_message_service: ChatMessageService,
    private readonly chat_access_service: ChatAccessService,
    private readonly chat_message_gateway: ChatMessageGateway,
  ) {}

  @Post(":chat_id/read")
  async run(
    @GetUserId() user_id: string,
    @Param("chat_id", new ParseUUIDPipe()) chat_id: string,
    @Body() body: MarkChatMessagesReadHttpDto,
  ) {
    const chat = await this.chat_service.findOne({ id: chat_id });
    this.chat_access_service.assertChatParticipant(chat, user_id);

    const result = await this.chat_message_service.markAsRead({
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
