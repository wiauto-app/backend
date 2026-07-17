import { Body, Controller, ForbiddenException, Param, ParseUUIDPipe, Patch, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { ChatMessageService } from "@/src/contexts/chat/services/chat-message.service";
import { ChatMessageReadModelService } from "@/src/contexts/chat/services/chat-message-read-model.service";
import { ChatMessageGateway } from "@/src/contexts/chat/gateways/chat-message.gateway";
import { CHAT_MESSAGE_TYPE } from "@/src/contexts/chat/types/chatMessage";

import { V1_CHAT_MESSAGES } from "../../../route.constants";
import { UpdateChatMessageHttpDto } from "./update-chat-message.http-dto";

@Controller(V1_CHAT_MESSAGES)
@UseGuards(JwtGuard)
export class UpdateChatMessageController {
  constructor(
    private readonly chat_message_service: ChatMessageService,
    private readonly chat_message_read_model_service: ChatMessageReadModelService,
    private readonly chat_message_gateway: ChatMessageGateway,
  ) {}

  @Patch(":id")
  async run(
    @GetUserId() user_id: string,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() body: UpdateChatMessageHttpDto,
  ) {
    const existing = await this.chat_message_service.findOne({ id });
    if (existing.sender_id !== user_id) {
      throw new ForbiddenException("No puedes editar este mensaje.");
    }
    if (existing.type !== CHAT_MESSAGE_TYPE.TEXT && body.content !== undefined) {
      throw new ForbiddenException("Solo los mensajes de texto se pueden editar.");
    }

    const updated = await this.chat_message_service.update({
      id,
      content: body.content,
      metadata: body.metadata,
    });

    const list_item = await this.chat_message_read_model_service.toListItem(updated);
    this.chat_message_gateway.emitMessageUpdated(list_item);
    return list_item;
  }
}
