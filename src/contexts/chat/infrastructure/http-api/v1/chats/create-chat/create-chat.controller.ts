import { Body, Controller, Post, UseGuards } from "@nestjs/common";

import { CreateChatUseCase } from "@/src/contexts/chat/application/chat-use-cases/create-chat-use-case/create-chat.use-case";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";

import { V1_CHATS } from "../../../route.constants";
import { CreateChatHttpDto } from "./create-chat.http-dto";

@Controller(V1_CHATS)
@UseGuards(JwtGuard)
export class CreateChatController {
  constructor(private readonly createChatUseCase: CreateChatUseCase) {}

  @Post()
  run(@GetUserId() user_id: string, @Body() body: CreateChatHttpDto) {
    const participants = [...new Set([...body.participants, user_id])];
    return this.createChatUseCase.execute({
      participants,
      chat_type: body.chat_type,
      vehicle_id: body.vehicle_id,
    });
  }
}

