import { Controller, Delete, ForbiddenException, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { ChatMessageService } from "@/src/contexts/chat/services/chat-message.service";
import { ChatMessageGateway } from "@/src/contexts/chat/gateways/chat-message.gateway";

import { V1_CHAT_MESSAGES } from "../../../route.constants";

@Controller(V1_CHAT_MESSAGES)
@UseGuards(JwtGuard)
export class DeleteChatMessageController {
  constructor(
    private readonly chat_message_service: ChatMessageService,
    private readonly chat_message_gateway: ChatMessageGateway,
  ) {}

  @Delete(":id")
  async run(
    @GetUserId() user_id: string,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    const existing = await this.chat_message_service.findOne({ id });
    if (existing.sender_id !== user_id) {
      throw new ForbiddenException("No puedes eliminar este mensaje.");
    }
    await this.chat_message_service.delete({ id });
    this.chat_message_gateway.emitMessageDeleted({ id, chat_id: existing.chat.id });
  }
}
