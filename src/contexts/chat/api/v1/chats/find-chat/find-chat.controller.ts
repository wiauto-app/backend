import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { ChatService } from "@/src/contexts/chat/services/chat.service";
import { ChatReadModelService } from "@/src/contexts/chat/services/chat-read-model.service";
import { ChatAccessService } from "@/src/contexts/chat/services/chat-access.service";

import { V1_CHATS } from "../../../route.constants";

@Controller(V1_CHATS)
@UseGuards(JwtGuard)
export class FindChatController {
  constructor(
    private readonly chat_service: ChatService,
    private readonly chat_read_model_service: ChatReadModelService,
    private readonly chat_access_service: ChatAccessService,
  ) {}

  @Get(":id")
  async run(
    @GetUserId() user_id: string,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    const chat = await this.chat_service.findOne({ id });
    this.chat_access_service.assertChatParticipant(chat, user_id);
    return this.chat_read_model_service.toChatListItem(chat, user_id);
  }
}
