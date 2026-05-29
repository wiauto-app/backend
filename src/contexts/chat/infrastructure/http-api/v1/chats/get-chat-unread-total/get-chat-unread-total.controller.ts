import { Controller, Get, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { GetChatUnreadTotalUseCase } from "@/src/contexts/chat/application/chat-use-cases/get-chat-unread-total-use-case/get-chat-unread-total.use-case";

import { V1_CHATS } from "../../../route.constants";

@Controller(V1_CHATS)
@UseGuards(JwtGuard)
export class GetChatUnreadTotalController {
  constructor(private readonly getChatUnreadTotalUseCase: GetChatUnreadTotalUseCase) {}

  @Get("unread-total")
  async run(@GetUserId() user_id: string) {
    return this.getChatUnreadTotalUseCase.execute({ user_id });
  }
}
