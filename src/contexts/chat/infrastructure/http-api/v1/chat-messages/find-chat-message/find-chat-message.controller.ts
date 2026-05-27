import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { FindChatMessageUseCase } from "@/src/contexts/chat/application/chat-message-use-cases/find-chat-message-use-case/find-chat-message.use-case";
import { ChatAccessService } from "@/src/contexts/chat/infrastructure/services/chat-access.service";

import { V1_CHAT_MESSAGES } from "../../../route.constants";

@Controller(V1_CHAT_MESSAGES)
@UseGuards(JwtGuard)
export class FindChatMessageController {
  constructor(
    private readonly find_chat_message_use_case: FindChatMessageUseCase,
    private readonly chat_access_service: ChatAccessService,
  ) {}

  @Get(":id")
  async run(
    @GetUserId() user_id: string,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    const message = await this.find_chat_message_use_case.execute({ id });
    this.chat_access_service.assertChatParticipant(message.chat, user_id);
    return message;
  }
}

