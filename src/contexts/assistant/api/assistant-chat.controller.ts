import { Body, Controller, HttpCode, HttpStatus, Post, Res, UseGuards } from "@nestjs/common";
import { Response } from "express";
import type { UIMessage } from "ai";
import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { V1_ASSISTANT } from "../route.constants";
import { AssistantChatService } from "../services/assistant-chat.service";
import { AssistantChatDto } from "../dto/assistant-chat.dto";

@Controller(V1_ASSISTANT)
@UseGuards(JwtGuard)
export class AssistantChatController {
  constructor(private readonly assistantChatService: AssistantChatService) {}

  @Post("chat")
  @HttpCode(HttpStatus.OK)
  async chat(
    @Body() body: AssistantChatDto,
    @GetUserId() userId: string,
    @Res() response: Response,
  ): Promise<void> {
    await this.assistantChatService.streamChat({
      messages: body.messages as UIMessage[],
      conversationId: body.conversation_id,
      userId,
      response,
    });
  }
}
