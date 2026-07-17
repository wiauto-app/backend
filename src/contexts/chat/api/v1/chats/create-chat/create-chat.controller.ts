import { Body, Controller, Post, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { ChatService } from "@/src/contexts/chat/services/chat.service";

import { V1_CHATS } from "../../../route.constants";
import { CreateChatHttpDto } from "./create-chat.http-dto";

@Controller(V1_CHATS)
@UseGuards(JwtGuard)
export class CreateChatController {
  constructor(private readonly chat_service: ChatService) {}

  @Post()
  run(@GetUserId() user_id: string, @Body() body: CreateChatHttpDto) {
    const participants = [...new Set([...body.participants, user_id])];
    return this.chat_service.create({
      participants,
      chat_type: body.chat_type,
      vehicle_id: body.vehicle_id,
    });
  }
}
