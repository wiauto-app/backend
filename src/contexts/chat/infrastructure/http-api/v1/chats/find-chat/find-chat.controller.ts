import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { FindChatUseCase } from "@/src/contexts/chat/application/chat-use-cases/find-chat-use-case/find-chat.use-case";
import { ChatReadModelService } from "@/src/contexts/chat/application/services/chat-read-model.service";
import { ChatAccessService } from "@/src/contexts/chat/infrastructure/services/chat-access.service";

import { V1_CHATS } from "../../../route.constants";

@Controller(V1_CHATS)
@UseGuards(JwtGuard)
export class FindChatController {
  constructor(
    private readonly find_chat_use_case: FindChatUseCase,
    private readonly chat_read_model_service: ChatReadModelService,
    private readonly chat_access_service: ChatAccessService,
  ) {}

  @Get(":id")
  async run(
    @GetUserId() user_id: string,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    const chat = await this.find_chat_use_case.execute({ id });
    this.chat_access_service.assertChatParticipant(chat, user_id);
    return this.chat_read_model_service.toChatListItem(chat, user_id);
  }
}

