import { Body, Controller, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { FindChatUseCase } from "@/src/contexts/chat/application/chat-use-cases/find-chat-use-case/find-chat.use-case";
import { CreateChatMessageUseCase } from "@/src/contexts/chat/application/chat-message-use-cases/create-chat-message-use-case/create-chat-message.use-case";
import { ChatAccessService } from "@/src/contexts/chat/infrastructure/services/chat-access.service";
import { ChatMessageGateway } from "@/src/contexts/chat/infrastructure/gateways/chat-message.gateway";

import { V1_CHATS } from "../../../route.constants";
import { CreateChatMessageHttpDto } from "./create-chat-message.http-dto";

@Controller(V1_CHATS)
@UseGuards(JwtGuard)
export class CreateChatMessageController {
  constructor(
    private readonly find_chat_use_case: FindChatUseCase,
    private readonly create_chat_message_use_case: CreateChatMessageUseCase,
    private readonly chat_access_service: ChatAccessService,
    private readonly chat_message_gateway: ChatMessageGateway,
  ) {}

  @Post(":chat_id/messages")
  async run(
    @GetUserId() sender_id: string,
    @Param("chat_id", new ParseUUIDPipe()) chat_id: string,
    @Body() body: CreateChatMessageHttpDto,
  ) {
    const chat = await this.find_chat_use_case.execute({ id: chat_id });
    this.chat_access_service.assertChatParticipant(chat, sender_id);

    const message = await this.create_chat_message_use_case.execute({
      chat_id,
      sender_id,
      content: body.content,
      type: body.type,
    });

    this.chat_message_gateway.emitMessageCreated(message);
    return message;
  }
}

