import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { ChatMessageService } from "@/src/contexts/chat/services/chat-message.service";
import { ChatAccessService } from "@/src/contexts/chat/services/chat-access.service";

import { V1_CHAT_MESSAGES } from "../../../route.constants";

@Controller(V1_CHAT_MESSAGES)
@UseGuards(JwtGuard)
export class FindChatMessageController {
  constructor(
    private readonly chat_message_service: ChatMessageService,
    private readonly chat_access_service: ChatAccessService,
  ) {}

  @Get(":id")
  async run(
    @GetUserId() user_id: string,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    const message = await this.chat_message_service.findOne({ id });
    this.chat_access_service.assertChatParticipant(message.chat, user_id);
    return message;
  }
}
