import { Body, Controller, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { ChatService } from "@/src/contexts/chat/services/chat.service";
import { ChatMessageService } from "@/src/contexts/chat/services/chat-message.service";
import { ChatMessageReadModelService } from "@/src/contexts/chat/services/chat-message-read-model.service";
import { ChatAccessService } from "@/src/contexts/chat/services/chat-access.service";
import { ChatMessageGateway } from "@/src/contexts/chat/gateways/chat-message.gateway";
import { TypeOrmChatParticipantStateRepository } from "@/src/contexts/chat/repositories/typeorm.chat-participant-state-repository";

import { V1_CHATS } from "../../../route.constants";
import { CreateChatMessageHttpDto } from "./create-chat-message.http-dto";

@Controller(V1_CHATS)
@UseGuards(JwtGuard)
export class CreateChatMessageController {
  constructor(
    private readonly chat_service: ChatService,
    private readonly chat_message_service: ChatMessageService,
    private readonly chat_access_service: ChatAccessService,
    private readonly chat_message_gateway: ChatMessageGateway,
    private readonly chat_message_read_model_service: ChatMessageReadModelService,
    private readonly chat_participant_state_repository: TypeOrmChatParticipantStateRepository,
  ) {}

  @Post(":chat_id/messages")
  async run(
    @GetUserId() sender_id: string,
    @Param("chat_id", new ParseUUIDPipe()) chat_id: string,
    @Body() body: CreateChatMessageHttpDto,
  ) {
    const chat = await this.chat_service.findOne({ id: chat_id });
    this.chat_access_service.assertChatParticipant(chat, sender_id);

    const message = await this.chat_message_service.create({
      chat_id,
      sender_id,
      content: body.content,
      type: body.type,
      metadata: body.metadata,
    });

    const list_item = await this.chat_message_read_model_service.toListItem(message);
    const delivered_messages =
      await this.chat_message_gateway.tryMarkDeliveredAndEmit(message, chat.participants);

    this.chat_message_gateway.emitMessageCreated(list_item);

    const other_participant_ids = chat.participants.filter(
      (participant_id) => participant_id !== sender_id,
    );
    for (const participant_id of other_participant_ids) {
      const state = await this.chat_participant_state_repository.findOne(
        chat_id,
        participant_id,
      );
      this.chat_message_gateway.emitUnreadUpdated({
        chat_id,
        user_id: participant_id,
        unread_count: state?.unread_count ?? 0,
      });
    }

    if (delivered_messages.length > 0) {
      for (const delivered of delivered_messages) {
        const delivered_item = await this.chat_message_read_model_service.toListItem(delivered);
        this.chat_message_gateway.emitMessageUpdated(delivered_item);
      }
    }

    return list_item;
  }
}
