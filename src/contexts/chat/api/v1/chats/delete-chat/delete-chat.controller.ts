import { Controller, Delete, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { ChatService } from "@/src/contexts/chat/services/chat.service";
import { ChatAccessService } from "@/src/contexts/chat/services/chat-access.service";

import { V1_CHATS } from "../../../route.constants";

@Controller(V1_CHATS)
@UseGuards(JwtGuard)
export class DeleteChatController {
  constructor(
    private readonly chat_service: ChatService,
    private readonly chat_access_service: ChatAccessService,
  ) {}

  @Delete(":id")
  async run(
    @GetUserId() user_id: string,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    const chat = await this.chat_service.findOne({ id });
    this.chat_access_service.assertChatParticipant(chat, user_id);
    await this.chat_service.delete({ id });
  }
}
