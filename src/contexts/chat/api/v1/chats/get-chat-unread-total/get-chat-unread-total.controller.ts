import { Controller, Get, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { ChatService } from "@/src/contexts/chat/services/chat.service";

import { V1_CHATS } from "../../../route.constants";

@Controller(V1_CHATS)
@UseGuards(JwtGuard)
export class GetChatUnreadTotalController {
  constructor(private readonly chat_service: ChatService) {}

  @Get("unread-total")
  async run(@GetUserId() user_id: string) {
    return this.chat_service.getUnreadTotal({ user_id });
  }
}
