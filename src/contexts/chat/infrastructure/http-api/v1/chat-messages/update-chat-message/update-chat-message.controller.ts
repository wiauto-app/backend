import { Body, Controller, ForbiddenException, Param, ParseUUIDPipe, Patch, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { FindChatMessageUseCase } from "@/src/contexts/chat/application/chat-message-use-cases/find-chat-message-use-case/find-chat-message.use-case";
import { UpdateChatMessageUseCase } from "@/src/contexts/chat/application/chat-message-use-cases/update-chat-message-use-case/update-chat-message.use-case";
import { ChatMessageReadModelService } from "@/src/contexts/chat/application/services/chat-message-read-model.service";
import { ChatMessageGateway } from "@/src/contexts/chat/infrastructure/gateways/chat-message.gateway";
import { CHAT_MESSAGE_TYPE } from "@/src/contexts/chat/domain/entities/chatMessage";

import { V1_CHAT_MESSAGES } from "../../../route.constants";
import { UpdateChatMessageHttpDto } from "./update-chat-message.http-dto";

@Controller(V1_CHAT_MESSAGES)
@UseGuards(JwtGuard)
export class UpdateChatMessageController {
  constructor(
    private readonly find_chat_message_use_case: FindChatMessageUseCase,
    private readonly update_chat_message_use_case: UpdateChatMessageUseCase,
    private readonly chat_message_read_model_service: ChatMessageReadModelService,
    private readonly chat_message_gateway: ChatMessageGateway,
  ) {}

  @Patch(":id")
  async run(
    @GetUserId() user_id: string,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() body: UpdateChatMessageHttpDto,
  ) {
    const existing = await this.find_chat_message_use_case.execute({ id });
    if (existing.sender_id !== user_id) {
      throw new ForbiddenException("No puedes editar este mensaje.");
    }
    if (existing.type !== CHAT_MESSAGE_TYPE.TEXT && body.content !== undefined) {
      throw new ForbiddenException("Solo los mensajes de texto se pueden editar.");
    }

    const updated = await this.update_chat_message_use_case.execute({
      id,
      content: body.content,
      metadata: body.metadata,
    });

    const list_item = await this.chat_message_read_model_service.toListItem(updated);
    this.chat_message_gateway.emitMessageUpdated(list_item);
    return list_item;
  }
}
