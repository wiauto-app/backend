import { Controller, Delete, ForbiddenException, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { FindChatMessageUseCase } from "@/src/contexts/chat/application/chat-message-use-cases/find-chat-message-use-case/find-chat-message.use-case";
import { DeleteChatMessageUseCase } from "@/src/contexts/chat/application/chat-message-use-cases/delete-chat-message-use-case/delete-chat-message.use-case";
import { ChatMessageGateway } from "@/src/contexts/chat/infrastructure/gateways/chat-message.gateway";

import { V1_CHAT_MESSAGES } from "../../../route.constants";

@Controller(V1_CHAT_MESSAGES)
@UseGuards(JwtGuard)
export class DeleteChatMessageController {
  constructor(
    private readonly find_chat_message_use_case: FindChatMessageUseCase,
    private readonly delete_chat_message_use_case: DeleteChatMessageUseCase,
    private readonly chat_message_gateway: ChatMessageGateway,
  ) {}

  @Delete(":id")
  async run(
    @GetUserId() user_id: string,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    const existing = await this.find_chat_message_use_case.execute({ id });
    if (existing.sender_id !== user_id) {
      throw new ForbiddenException("No puedes eliminar este mensaje.");
    }
    await this.delete_chat_message_use_case.execute({ id });
    this.chat_message_gateway.emitMessageDeleted({ id, chat_id: existing.chat.id });
  }
}

